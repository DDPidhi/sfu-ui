import { useState, useEffect } from 'react';

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
}

const DUMMY_QUESTIONS: Question[] = [
    {
        id: 1,
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2
    },
    {
        id: 2,
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1
    },
    {
        id: 3,
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1
    },
    {
        id: 4,
        question: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Silver", "Oxygen", "Iron"],
        correctAnswer: 2
    },
    {
        id: 5,
        question: "What year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2
    }
];

interface DummyTestProps {
    studentName: string;
    onComplete: (score: number, total: number) => void;
}

export default function DummyTest({ studentName, onComplete }: DummyTestProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        new Array(DUMMY_QUESTIONS.length).fill(null)
    );
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

    useEffect(() => {
        if (isSubmitted || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted, timeRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (isSubmitted) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = optionIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < DUMMY_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        const score = selectedAnswers.reduce((acc, answer, index) => {
            if (answer === DUMMY_QUESTIONS[index].correctAnswer) {
                return acc + 1;
            }
            return acc;
        }, 0);
        onComplete(score, DUMMY_QUESTIONS.length);
    };

    const answeredCount = selectedAnswers.filter(a => a !== null).length;
    const question = DUMMY_QUESTIONS[currentQuestion];

    if (isSubmitted) {
        const score = selectedAnswers.reduce((acc, answer, index) => {
            if (answer === DUMMY_QUESTIONS[index].correctAnswer) {
                return acc + 1;
            }
            return acc;
        }, 0);

        return (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
                <div className="text-center">
                    <div className="text-6xl mb-4">
                        {score >= DUMMY_QUESTIONS.length * 0.7 ? '🎉' : '📝'}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Completed!</h2>
                    <p className="text-gray-600 mb-4">Thank you for completing the test, {studentName}</p>
                    <div className="bg-gray-100 rounded-lg p-4 inline-block">
                        <div className="text-4xl font-bold text-primary">
                            {score} / {DUMMY_QUESTIONS.length}
                        </div>
                        <div className="text-gray-500 text-sm">
                            {Math.round((score / DUMMY_QUESTIONS.length) * 100)}% Score
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Proctored Exam</h2>
                    <p className="text-gray-500 text-sm">Student: {studentName}</p>
                </div>
                <div className={`text-lg font-mono px-4 py-2 rounded-lg ${
                    timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
                }`}>
                    {formatTime(timeRemaining)}
                </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Question {currentQuestion + 1} of {DUMMY_QUESTIONS.length}</span>
                    <span>{answeredCount} answered</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${((currentQuestion + 1) / DUMMY_QUESTIONS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {question.question}
                </h3>
                <div className="space-y-3">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                selectedAnswers[currentQuestion] === index
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                        >
                            <span className="font-medium mr-3">
                                {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Navigation Dots */}
            <div className="flex justify-center gap-2 mb-6">
                {DUMMY_QUESTIONS.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                            currentQuestion === index
                                ? 'bg-primary text-white'
                                : selectedAnswers[index] !== null
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>

                {currentQuestion === DUMMY_QUESTIONS.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={answeredCount < DUMMY_QUESTIONS.length}
                        className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Test
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
