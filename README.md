```markdown
# Study Buddy - Question Bank Application

## Table of Contents

- [About The Project](#about-the-project)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Data Structure](#data-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About The Project

Study Buddy is a modern, vibrant, and playful question bank web application designed to help students explore various subjects and topics with ease. It provides a clean and engaging interface to study questions, mark them for review, and toggle between randomized and linear question sequences. The app reads all data dynamically from a JSON file, making it easy to maintain and extend.

The app is optimized for focused study sessions by using a calming creamy theme and smooth interactive elements.

---

## Features

- Subject selection starting in the center of the screen, then moves to header for ease of switching.
- Select topics within subjects to customize study focus.
- View questions in a clean single-column layout with clear spacing.
- Randomize question order using a toggle switch.
- Mark questions for review with persistent local storage.
- Review mode toggle to view only marked questions.
- Responsive and accessible design for all screen sizes and users.
- Modern, vibrant, and study-friendly visual theme.
- Dynamic data loading from JSON file for easy data management.

---

## Installation

1. Clone or download the repository.

```
git clone https://github.com/yourusername/study-buddy.git
cd study-buddy
```

2. Place all necessary files in the same directory:
   - `index.html`
   - `app.js`
   - `style.css`
   - `data.json` (your question data)

3. Since the app loads data dynamically via `fetch`, serve it using a local web server.

### Using Python (built-in):

```
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

### Using VSCode Live Server Extension:

- Install the Live Server extension.
- Right-click `index.html` and select "Open with Live Server".

---

## Usage

- Open the app in a supported browser.
- Choose a subject from the central subject cards.
- Select one or more topics to study.
- Start studying: questions will be displayed.
- Toggle randomize and review mode from the header.
- Mark questions for review by clicking the pin icon.
- Switch subjects anytime via the dropdown in the header.

Review questions are saved in browser localStorage and persist across sessions.

---

## Data Structure

The app reads all question data dynamically from `data.json` structured as follows:

```
{
  "subjects": {
    "mathematics": {
      "name": "Mathematics",
      "topics": {
        "algebra": {
          "name": "Algebra",
          "questions": [
            "Question 1",
            "Question 2"
          ]
        }
      }
    }
  }
}
```

You can easily add new subjects, topics, and questions by editing `data.json`.

---

## Technologies Used

- HTML5
- CSS3 (with custom properties and animations)
- JavaScript (ES6+)
- JSON for dynamic data loading
- LocalStorage for review persistence

---

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for:

- Adding new features
- Improving existing functionality
- Enhancing accessibility or responsiveness
- Fixing bugs or code optimizations

---

## License

This project is open source and available under the MIT License.

---

## Contact

For questions or support, contact the project maintainer:

- Email: your.email@example.com
- GitHub: [yourusername](https://github.com/yourusername)

---

*Happy Studying! 📚✨*

```