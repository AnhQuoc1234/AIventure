#!/bin/bash

curl https://adventure-editor-z-804602580672.us-central1.run.app/export/2?token=972f0e655a9d72946db4e42b8006fdec -o ./exports/export.zip

unzip -o ./exports/export.zip -d ./public/assets/gamedata


