// Sample data for Study Buddy
const questionBankData = {
    subjects: {
        math: {
            name: "Mathematics",
            icon: "🧮",
            color: "#42a5f5",
            topics: {
                algebra: {
                    name: "Algebra",
                    questions: [
                        "Solve for x: 2x + 5 = 15",
                        "Factor the expression: x² - 4",
                        "Simplify: (3x²y)(4xy³)",
                        "Solve the system: 2x + y = 7, x - y = -1"
                    ]
                },
                geometry: {
                    name: "Geometry",
                    questions: [
                        "Calculate the area of a circle with radius 5",
                        "Find the volume of a cylinder with radius 3 and height 8",
                        "Prove the Pythagorean theorem",
                        "Calculate the angles of a triangle with sides 3, 4, 5"
                    ]
                },
                calculus: {
                    name: "Calculus",
                    questions: [
                        "Find the derivative of f(x) = 3x² + 2x - 5",
                        "Calculate the integral of ∫(2x + 3) dx",
                        "Find the limit as x approaches 0 of (sin x)/x",
                        "Solve the differential equation: dy/dx = 2y"
                    ]
                }
            }
        },
        science: {
            name: "Science",
            icon: "🔬",
            color: "#66bb6a",
            topics: {
                physics: {
                    name: "Physics",
                    questions: [
                        "State Newton's three laws of motion",
                        "Calculate the force needed to accelerate a 5kg object at 3m/s²",
                        "Explain the difference between kinetic and potential energy",
                        "Describe the photoelectric effect"
                    ]
                },
                chemistry: {
                    name: "Chemistry",
                    questions: [
                        "Balance the equation: H₂ + O₂ → H₂O",
                        "Explain the difference between ionic and covalent bonds",
                        "Describe the process of electrolysis",
                        "What is the pH of a 0.01M HCl solution?"
                    ]
                },
                biology: {
                    name: "Biology",
                    questions: [
                        "Explain the process of photosynthesis",
                        "Describe the structure of DNA",
                        "What is the difference between mitosis and meiosis?",
                        "Explain how enzymes work as biological catalysts"
                    ]
                }
            }
        },
        history: {
            name: "History",
            icon: "📜",
            color: "#ffa726",
            topics: {
                ancient: {
                    name: "Ancient History",
                    questions: [
                        "What were the main achievements of the Roman Empire?",
                        "Describe the political system of Ancient Athens",
                        "What caused the fall of the Western Roman Empire?",
                        "Explain the significance of the Code of Hammurabi"
                    ]
                },
                modern: {
                    name: "Modern History",
                    questions: [
                        "What were the main causes of World War I?",
                        "Describe the effects of the Industrial Revolution",
                        "Explain the Cold War and its main events",
                        "What were the key factors in the fall of the Berlin Wall?"
                    ]
                }
            }
        }
    }
};