# ChatMind - Trading Journal & Analysis Platform

A comprehensive trading journal and analysis platform with AI-powered insights, social features, and broker integration.

## Features

- **Trade Journal**: Track and analyze your trades with detailed metrics
- **AI Analysis**: Get AI-powered insights and recommendations for your trading performance
- **Social Features**: Share trade stories, follow other traders, and build a community
- **Broker Integration**: Connect with popular trading platforms (Zerodha, ICICI Direct, etc.)
- **Gamification**: Earn badges, compete on leaderboards, and track achievements
- **Mentor Marketplace**: Connect with trading mentors and book sessions

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth
- **UI**: Tailwind CSS + shadcn/ui components
- **Charts**: Chart.js for financial visualization

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Deployment

This application is deployed on Hugging Face Spaces using Docker.

### Environment Variables

The following environment variables are required:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Trades
- `GET /api/trades` - Get user's trades
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade

### AI Analysis
- `GET /api/ai-analysis/reports` - Get analysis reports
- `POST /api/ai-analysis/generate` - Generate new analysis

### Social Features
- `GET /api/social/posts` - Get social posts
- `POST /api/social/posts` - Create new post
- `GET /api/social/stories` - Get trade stories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
