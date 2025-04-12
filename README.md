# Google Multimodal Live API - Boilerplate

A fork of [google-gemini/live-api-web-console](https://github.com/google-gemini/live-api-web-console)

## Contents

- [About](#about)
- [Local development setup](#local-development-setup)

## About

This repository contains a React-based starter app for using Google's [Multimodal Live API](https://ai.google.dev/api/multimodal-live) via WebSocket. It provides a foundation for building applications that leverage low-latency bidirectional voice and video interactions with Gemini, Google's flagship AI model.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). The architecture consists of:

- An event-emitting Websocket client to ease communication between the Websocket and the frontend
- A communication layer for processing audio input and output
- A splitscreen console-canvas view for viewing logs and starting to build your own apps

## Local development setup

**Step 1:**
[Obtain a free Gemini API key](https://aistudio.google.com/apikey).

**Step 2:**
Add your API key to the `.env` file.

**Step 3:**
In your terminal, navigate to the directory containing this README.

**Step 4:**
Install dependencies and start the development server:

```bash
npm install && npm start
```
