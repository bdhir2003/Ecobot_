import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
from flask import Flask, render_template, request, jsonify
from test import run_workflow, WorkflowInput

app = Flask(__name__)

# Simple in-memory session storage
# Format: {session_id: [history_items]}
sessions = {}

@app.route('/')
def index():
    return render_template('index.html')

# Logging configuration
LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'conversations.jsonl')
CSV_LOG_FILE = os.path.join(os.path.dirname(__file__), 'all_responses.csv')
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log_interaction(session_id, user_message, bot_response, topic, evaluation=None):
    import json
    from datetime import datetime
    
    entry = {
        "timestamp": datetime.now().isoformat(),
        "session_id": session_id,
        "user_message": user_message,
        "bot_response": bot_response,
        "topic": topic,
        "evaluation": evaluation
    }
    
    with open(LOG_FILE, 'a') as f:
        f.write(json.dumps(entry) + '\n')
        
    # Write to CSV
    import csv
    file_exists = os.path.isfile(CSV_LOG_FILE)
    
    with open(CSV_LOG_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(['Timestamp', 'Session ID', 'Topic', 'User Message', 'Bot Response', 'Fairness (0-100)', 'Accuracy (0-100)', 'Compliance', 'Explanation', 'Cost', 'Latency', 'Fallback'])
            
        eval_fairness = evaluation.get('fairness_score') if evaluation and not evaluation.get('error') else ''
        eval_accuracy = evaluation.get('accuracy_score') if evaluation and not evaluation.get('error') else ''
        eval_compliance = evaluation.get('compliance') if evaluation and not evaluation.get('error') else ''
        eval_explanation = evaluation.get('explanation') if evaluation and not evaluation.get('error') else ''
        
        eval_cost = evaluation.get('cost', '') if evaluation else ''
        eval_latency = evaluation.get('latency', '') if evaluation else ''
        eval_fallback = evaluation.get('fallback', '') if evaluation else ''
        
        writer.writerow([
            entry['timestamp'],
            entry['session_id'],
            entry['topic'],
            entry['user_message'],
            entry['bot_response'],
            eval_fairness,
            eval_accuracy,
            eval_compliance,
            eval_explanation,
            eval_cost,
            eval_latency,
            eval_fallback
        ])

def get_logs():
    import json
    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            for line in f:
                try:
                    logs.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return logs

def update_log_evaluation(timestamp, evaluation):
    import json
    logs = get_logs()
    updated = False
    
    # Simple linear scan implementation - in production use a real DB
    # We will rewrite the file
    new_logs = []
    for log in logs:
        if log.get("timestamp") == timestamp:
            log["evaluation"] = evaluation
            updated = True
        new_logs.append(log)
        
    if updated:
         with open(LOG_FILE, 'w') as f:
            for log in new_logs:
                f.write(json.dumps(log) + '\n')
    return updated


@app.route('/chat', methods=['POST'])
async def chat():
    try:
        data = request.json
        user_message = data.get('message')
        # Use session_id from client or default to 'default'
        session_id = data.get('session_id', 'default')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Retrieve history for this session
        history = sessions.get(session_id, {}).get("history", [])
        last_topic = sessions.get(session_id, {}).get("last_topic")

        # Create workflow input with history
        workflow_input = WorkflowInput(input_as_text=user_message, history=history, previous_topic=last_topic)
        
        # Measure Latency
        import time
        start_time = time.time()
        
        # Run the workflow
        result = await run_workflow(workflow_input)
        
        end_time = time.time()
        latency_ms = round((end_time - start_time) * 1000, 2)
        
        # Update history
        if session_id not in sessions:
            sessions[session_id] = {"history": [], "last_topic": None}
            
        sessions[session_id]["history"].append({
            "role": "user",
            "content": [{"type": "input_text", "text": user_message}]
        })
        
        response_text = ""
        response_data = {}
        
        current_topic = None
        if isinstance(result, dict):
            response_data = result
            response_text = result.get("output_text", "")
            current_topic = result.get("topic")
            
            # Use the history returned from the agent runner if available
            # This ensures we use the correct Types/Schemas for the agents library
            if "history" in result and result["history"]:
                sessions[session_id]["history"] = result["history"]
            else:
                 # Fallback if for some reason history is not returned (e.g. error case not handled)
                 if response_text:
                     sessions[session_id]["history"].append({
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": response_text}]
                    })
        else:
            response_text = str(result)
            response_data = {'output_text': response_text}
            if response_text:
                 sessions[session_id]["history"].append({
                    "role": "assistant",
                    "content": [{"type": "output_text", "text": response_text}]
                })
            
        # Update last topic if we have one, otherwise keep previous (unless we switched?)
        if current_topic:
             sessions[session_id]["last_topic"] = current_topic
             
        # Metric Calculation
        # Cost Estimation (Approximate based on GPT-4o pricing: ~$5/1M in, ~$15/1M out)
        # 1 token ~= 4 chars
        input_chars = len(user_message)
        output_chars = len(response_text)
        est_input_tokens = input_chars / 4
        est_output_tokens = output_chars / 4
        cost = (est_input_tokens / 1_000_000 * 5.00) + (est_output_tokens / 1_000_000 * 15.00)
        cost_str = f"${cost:.6f}"
        
        # Fallback detection
        # Simple heuristic: if response indicates inability to classify or handle request
        fallback = "No"
        if "I couldn't classify" in response_text or "provide a city name" in response_text:
            fallback = "Yes"
            
        # Run real-time evaluation
        evaluation = None
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            
            eval_prompt = f"""
            You are an AI evaluator. Evaluate the following response to the user query.
            
            User Query: {user_message}
            Bot Response: {response_text}
            
            Evaluate on:
            1. Fairness (0-100): Is the response unbiased?
            2. Accuracy (0-100): Does it seem factually sound based on the context?
            3. Compliance (Yes/No): Did it follow instructions (citations, brevity, etc.)?
            
            Return JSON format:
            {{
                "fairness_score": int,
                "accuracy_score": int,
                "compliance": "string",
                "explanation": "string"
            }}
            """
            
            completion = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": eval_prompt}],
                response_format={"type": "json_object"}
            )
            
            eval_result = completion.choices[0].message.content
            import json
            evaluation = json.loads(eval_result)
            
            # Add new metrics to evaluation object for UI
            evaluation['cost'] = cost_str
            evaluation['latency'] = f"{latency_ms}ms"
            evaluation['fallback'] = fallback
            evaluation['prompt_tokens'] = int(est_input_tokens)
            evaluation['completion_tokens'] = int(est_output_tokens)
            evaluation['total_tokens'] = int(est_input_tokens + est_output_tokens)
             
        except Exception as eval_err:
            print(f"Evaluation failed: {eval_err}")
            evaluation = {
                "error": "Evaluation failed", 
                "cost": cost_str, 
                "latency": f"{latency_ms}ms", 
                "fallback": fallback,
                "prompt_tokens": int(est_input_tokens),
                "completion_tokens": int(est_output_tokens),
                "total_tokens": int(est_input_tokens + est_output_tokens)
            }
            
        # Log the interaction with evaluation
        log_interaction(session_id, user_message, response_text, sessions[session_id].get("last_topic"), evaluation)
        
        # Add evaluation to response data for UI
        response_data['evaluation'] = evaluation
            
        return jsonify(response_data)



    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/evaluations')
def evaluations():
    logs = get_logs()
    # Sort by timestamp desc
    logs.reverse()
    return render_template('logs.html', logs=logs)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/run_eval', methods=['POST'])
async def run_eval():
    try:
        data = request.json
        timestamp = data.get('timestamp')
        query = data.get('query')
        response = data.get('response')
        
        if not all([timestamp, query, response]):
            return jsonify({'error': 'Missing data'}), 400
            
        # Run evaluation using OpenAI
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        eval_prompt = f"""
        You are an AI evaluator. Evaluate the following response to the user query.
        
        User Query: {query}
        Bot Response: {response}
        
        Evaluate on:
        1. Fairness (1-5): Is the response unbiased?
        2. Accuracy (1-5): Does it seem factually sound based on the context?
        3. Compliance (Yes/No): Did it follow instructions (e.g. was it brief if it was supposed to be)?
        
        Return JSON format:
        {{
            "fairness_score": float,
            "accuracy_score": float,
            "compliance": "string",
            "explanation": "string"
        }}
        """
        
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": eval_prompt}],
            response_format={"type": "json_object"}
        )
        
        eval_result = completion.choices[0].message.content
        import json
        eval_json = json.loads(eval_result)
        
        # Update log
        update_log_evaluation(timestamp, eval_json)
        
        return jsonify(eval_json)

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
