#!/bin/bash

# Script to automatically generate manifest.json from all .md files in content folders

cd "/Users/bobbydhir/Desktop/untitled folder/untitled"

# Start building JSON
echo '{' > content/manifest.json

# Education files
echo '  "education": [' >> content/manifest.json
first=true
for file in content/education/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Skills files
echo '  "skills": [' >> content/manifest.json
first=true
for file in content/skills/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Projects files
echo '  "projects": [' >> content/manifest.json
first=true
for file in content/projects/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Publications files
echo '  "publications": [' >> content/manifest.json
first=true
for file in content/publications/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Podcasts files
echo '  "podcasts": [' >> content/manifest.json
first=true
for file in content/podcasts/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Videos files
echo '  "videos": [' >> content/manifest.json
first=true
for file in content/videos/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ],' >> content/manifest.json

# Awards files (last one, no comma)
echo '  "awards": [' >> content/manifest.json
first=true
for file in content/awards/*.md; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [ "$first" = true ]; then
            echo "    \"$basename_file\"" >> content/manifest.json
            first=false
        else
            echo "    ,\"$basename_file\"" >> content/manifest.json
        fi
    fi
done
echo '  ]' >> content/manifest.json

echo '}' >> content/manifest.json

echo "✅ Manifest updated with all .md files"
