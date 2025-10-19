## Populate sessions script:
npx ts-node insertCustomData.ts 6848c062ed400fa2ff8571ca


## Google docs link:
https://docs.google.com/document/d/1KDfiCvyOiYMmg5A1sj6P2BvHX_6CiuUvIK_mPFz0KJI/edit?usp=sharing

## Ngrok command: ngrok http 3000


## Configure Stripe with local hooks and CLI (from their UI)
1. stripe login
2. stripe listen --forward-to localhost:3000/api/public/stripe-webhooks