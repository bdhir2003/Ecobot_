#!/usr/bin/env python3
import os
import json
import glob

# Change to the project directory
os.chdir("/Users/bobbydhir/Desktop/untitled folder/untitled")

manifest = {}

# Get all .md files for each content type
content_types = ['education', 'skills', 'projects', 'publications', 'podcasts', 'videos', 'awards']

for content_type in content_types:
    folder_path = f"content/{content_type}"
    if os.path.exists(folder_path):
        # Get all .md files in the folder
        md_files = glob.glob(f"{folder_path}/*.md")
        # Extract just the filenames
        filenames = [os.path.basename(f) for f in md_files]
        # Sort for consistency
        filenames.sort()
        manifest[content_type] = filenames
    else:
        manifest[content_type] = []

# Write the manifest.json file
with open('content/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)

print("✅ Manifest updated with all .md files")
print(f"Found files: {sum(len(files) for files in manifest.values())} total")
