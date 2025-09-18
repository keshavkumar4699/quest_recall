# QuestRecall - MongoDB Connected Spaced Repetition Learning App

A full-featured spaced repetition learning application with MongoDB backend, complete CRUD operations, and advanced study management features.

## 🚀 Features

### 📊 Spaced Repetition System (SRS)

- **Smart Scheduling**: Questions automatically scheduled based on difficulty
- **4-Level Rating System**: Again (1 day), Hard (3 days), Medium (7 days), Easy (14 days)
- **Adaptive Learning**: Ease factor adjusts based on performance
- **Progress Tracking**: Comprehensive statistics and retention rates

### 🗄️ MongoDB Integration

- **Full CRUD Operations**: Create, Read, Update, Delete for all entities
- **Persistent Storage**: All data stored in MongoDB database
- **RESTful API**: Clean API endpoints for all operations
- **Data Relationships**: Proper subject → topic → question hierarchy

### ⭐ Advanced Study Features

- **Important Questions**: Mark and review important questions separately
- **Multi-Topic Selection**: Select multiple topics for combined study sessions
- **Subject Filtering**: Study by specific subjects or all subjects
- **Randomization**: Randomize question order for varied practice

### ⚙️ Admin Panel

- **Subject Management**: Add, edit, delete subjects with icons and colors
- **Topic Management**: Organize topics under subjects
- **Question Management**: Full question CRUD with rich text support
- **Bulk Operations**: Efficient management of large question sets

### 📱 Modern UI/UX

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching based on system preference
- **Smooth Animations**: Card animations and transitions
- **Intuitive Navigation**: Easy-to-use interface with clear navigation

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd questrecall-mongodb
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/questrecall
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**

   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Use your connection string in `.env`

5. **Seed the database** (optional)

   ```bash
   npm run seed
   ```

6. **Start the application**

   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
questrecall-mongodb/
├── models/
│   ├── Subject.js          # Subject schema
│   ├── Topic.js            # Topic schema
│   └── Question.js         # Question schema
├── routes/
│   ├── subjects.js         # Subject API routes
│   ├── topics.js           # Topic API routes
│   └── questions.js        # Question API routes
├── public/
│   ├── index.html          # Main HTML file
│   ├── app.js              # Frontend JavaScript
│   └── style.css           # Styling
├── scripts/
│   └── seedData.js         # Database seeding script
├── server.js               # Express server setup
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## 🔧 API Endpoints

### Subjects

- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Topics

- `GET /api/topics` - Get all topics (with optional subject filter)
- `POST /api/topics` - Create new topic
- `PUT /api/topics/:id` - Update topic
- `DELETE /api/topics/:id` - Delete topic

### Questions

- `GET /api/questions` - Get questions (with filters)
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `PUT /api/questions/:id/rate` - Rate question (SRS update)
- `DELETE /api/questions/:id` - Delete question

## 🎯 Usage Guide

### For Students

1. **Select Subject**: Choose from available subjects or study all
2. **Choose Topics**: Select one or multiple topics to focus on
3. **Study Questions**: Rate each question based on difficulty
4. **Track Progress**: Monitor your retention rate and daily progress
5. **Review Important**: Mark and review important questions

### For Administrators

1. **Access Admin Panel**: Click the ⚙️ Admin button
2. **Manage Subjects**: Add subjects with custom icons and colors
3. **Organize Topics**: Create topics under subjects
4. **Add Questions**: Create questions with proper categorization
5. **Bulk Management**: Use filters to manage large datasets

## 🔄 Spaced Repetition Algorithm

The app uses a modified SM-2 algorithm:

- **Again**: 1 day interval, decrease ease factor
- **Hard**: 3 days interval, slightly decrease ease factor
- **Medium**: 7 days interval, maintain ease factor
- **Easy**: 14 days interval, increase ease factor

## 📊 Statistics Tracking

- **Due Today**: Questions scheduled for today
- **Due Overall**: Total overdue questions
- **Retention Rate**: Performance-based retention calculation
- **Daily Progress**: Questions answered compared to yesterday

## 🚀 Deployment

### Using PM2 (Production)

```bash
npm install -g pm2
pm2 start server.js --name questrecall
pm2 startup
pm2 save
```

### Using Docker

```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include error logs and system information

---

**Happy Learning with QuestRecall! 🎓✨**
