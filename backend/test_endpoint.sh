#!/bin/bash

# Test the analyze-brief endpoint with plain text

curl -X POST "http://localhost:8000/api/analyze-brief" \
  -F "text=Brand: MyProtein
Campaign: Whey Too Spooky

We are launching a limited-edition chocolate-orange protein bar for Halloween.
The goal is to drive product trial and create buzz around this seasonal flavor.

Target Audience: Ages 18-34, urban fitness enthusiasts, active on social media

Key Message: Get Fit, Get Spooky

Visual Style: Dark, playful Halloween theme with gym atmosphere

Channels: Instagram, YouTube

We want to work with fitness influencers to create Halloween-themed content
that showcases the product in fun, festive ways." \
  -H "Content-Type: multipart/form-data" \
  | python -m json.tool
