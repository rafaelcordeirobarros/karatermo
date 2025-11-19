# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Karatermo is a web-based educational game designed to help students learn Karate-Do terminology and concepts. It features a daily term challenge (similar to Wordle) and quiz modes with difficulty levels corresponding to karate belt rankings.

The application is a static website (vanilla HTML/CSS/JavaScript) that consumes a REST API hosted at `https://karatermo-api.onrender.com`.

## Application Architecture

### Pages and Their Purpose

1. **[index.htm](index.htm)** - Main daily term game
   - One term per day drawn from the API
   - Players have 3 attempts to guess the correct answer
   - Scoring based on accuracy and response time
   - Redirects to [freeQuiz.htm](freeQuiz.htm) when no daily term is available

2. **[quiz.htm](quiz.htm)** - Belt-level practice quiz
   - User selects name and target belt level
   - Generates 20 questions with difficulty distribution (50% easy, 30% medium, 20% hard)
   - Questions are filtered based on difficulty relative to selected belt

3. **[freeQuiz.htm](freeQuiz.htm)** - Open practice mode
   - User selects number of questions (minimum 10)
   - Uses all difficulty levels (30% very easy, 30% easy, 30% medium, 10% hard)
   - Shows correct answers and explanations after completion

### Core JavaScript Modules

- **[script.js](script.js)** - Daily term game logic and main page initialization
- **[quiz.js](quiz.js)** - Belt-level quiz implementation
- **[freeQuiz.js](freeQuiz.js)** - Free quiz mode implementation
- **[util.js](util.js)** - Shared utilities:
  - API endpoints configuration
  - `loadTerms()` - Fetches and caches term data
  - `todayInBrazil()` - Date handling for GMT-3 timezone
  - `populateSelect()` - Dynamic select element population
- **[localStorageFunctions.js](localStorageFunctions.js)** - LocalStorage with expiration
  - `setLocalStorage(key, value, minutes)` - Store data with TTL
  - `getLocalStorage(key)` - Retrieve non-expired data
- **[ranking.js](ranking.js)** - Ranking display and filtering by belt
- **[sendResults.js](sendResults.js)** - Player registration and score submission to API

### Data Flow

1. Terms are fetched from `/api/terms` and cached in localStorage for 24 hours
2. Daily term selection: filters terms array by `term.usage` array containing today's date (YYYY-MM-DD format)
3. User results stored in localStorage as `karatermoResults`
4. Player data stored in localStorage as `karatermoPlayer`
5. Results submitted to `/api/results` endpoint when user registers

### Scoring System

Points = max(0, round((1000 × accuracy) - (averageTime / 10)))

Where:
- accuracy = (totalCorrect / totalTerms) × 100
- averageTime = total seconds spent / number of terms

### API Endpoints

Base URL: `https://karatermo-api.onrender.com`

- `GET /api/terms` - Retrieve all karate terms with questions and difficulty ratings
- `GET /api/results` - Retrieve all player results for ranking
- `GET /api/results/email/:email` - Retrieve specific player by email
- `POST /api/results` - Upsert player results (registration + score update)

### Term Data Structure

Each term object contains:
```javascript
{
  term: "string",           // Japanese term
  meaning: "string",        // Portuguese explanation
  usage: ["YYYY-MM-DD"],   // Dates when this term is the daily challenge
  difficulty: {             // Difficulty per belt level
    blue: "easy|medium|hard|very easy|very hard",
    yellow: "...",
    // ... other belts
  },
  question: {
    questionText: "string",
    choices: ["string"],    // Multiple choice options
    correctAnswer: "string"
  }
}
```

### LocalStorage Keys

- `terms` - Cached term data (expires after 24 hours)
- `karatermoResults` - Array of user's answered terms
- `karatermoPlayer` - User registration data (name, belt, email, password)

## Development Notes

### Date Handling

The application uses Brazil timezone (GMT-3). Always use `todayInBrazil()` instead of `new Date()` for date comparisons to ensure consistent behavior across timezones.

### Quiz Question Selection

Both quiz modes ([quiz.js](quiz.js) and [freeQuiz.js](freeQuiz.js)) use a fallback system when insufficient questions exist for a difficulty level:
- Easy → Medium → Hard → Very Hard → Very Easy
- Medium → Hard → Very Hard → Easy → Very Easy
- Hard → Very Hard → Medium → Easy → Very Easy

Questions are shuffled using Fisher-Yates algorithm, including the answer choices within each question.

### Authentication

Player authentication is password-based via email lookup. The password is stored in localStorage and verified against the API response when submitting new results.

### Styling

Multiple CSS files are loaded depending on the page:
- [styles.css](styles.css) - Base styles and main page
- [quiz.css](quiz.css) - Quiz pages styling
- [freeQuiz.css](freeQuiz.css) - Free quiz specific styles
- [ranking-modal-styles.css](ranking-modal-styles.css) - Ranking modal
- [sendResults.css](sendResults.css) - Registration form
- [ranking.css](ranking.css) - Ranking list styles
- [menuHamburguer.css](menuHamburguer.css) - Mobile menu (currently disabled)

## Common Tasks

### Testing Locally

Since this is a static site, simply open any `.htm` file in a browser. The API calls will work as the endpoints are hardcoded to the production API.

### Adding New Features

When adding features that require new term properties, coordinate with the backend API to ensure data structure compatibility.

### Modifying Quiz Logic

Quiz generation logic is in:
- [quiz.js](quiz.js):192-271 (`getQuizTerms()` function)
- [freeQuiz.js](freeQuiz.js):161-244 (`getQuizTerms()` function)

Both share similar logic but with different difficulty distributions.
