BPSC Physics PYQ Quiz

Open index.html in a browser to use the quiz locally.

Progress is stored in the browser with localStorage. The app supports:
- topic filtering
- clickable options
- answer reveal after submission
- wrong and unknown tracking
- revision modes for wrong and unknown questions

Question data lives in questions.js as:

window.BPSC_PHYSICS_QUESTIONS = [
  {
    id: "unique-id",
    topic: "Mechanics",
    question: "Question text",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "A",
    explanation: "Optional explanation"
  }
];
