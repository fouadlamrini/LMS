import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import QuizTaker from '../components/quiz/QuizTaker';
import * as quizAttemptApi from '@/lib/api/quiz-attempts';
import { Quiz, Question } from '@/types';
import { QuestionType, QuizStatus } from '@/types/enums';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API module
jest.mock('@/lib/api/quiz-attempts', () => ({
  startQuizAttempt: jest.fn(),
  submitAnswer: jest.fn(),
  submitQuizAttempt: jest.fn(),
}));

describe('QuizTaker Component', () => {
  const mockPush = jest.fn();
  const mockQuestion: Question = {
    _id: 'q1',
    text: 'What is the capital of France?',
    type: QuestionType.MULTIPLE_CHOICE,
    score: 10,
    options: [
      { _id: 'opt1', text: 'London', correct: false },
      { _id: 'opt2', text: 'Paris', correct: true },
      { _id: 'opt3', text: 'Berlin', correct: false },
    ],
  };

  const mockQuiz: Quiz = {
    _id: 'quiz1',
    moduleId: {
      _id: 'mod1',
      title: 'Geography 101',
      courseId: {
        _id: 'course1',
        title: 'World Geography',
      },
    },
    questions: [mockQuestion],
    passingScore: 50,
    status: QuizStatus.PUBLISHED,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Initial State - Before Starting Quiz', () => {
    it('should render the start screen with quiz information', () => {
      render(<QuizTaker quiz={mockQuiz} />);

      expect(screen.getByText('Ready to Test Your Knowledge?')).toBeInTheDocument();
      expect(screen.getByText('Geography 101')).toBeInTheDocument();
      expect(screen.getByText(/World Geography/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Number of questions
      expect(screen.getByText('50')).toBeInTheDocument(); // Passing score
      expect(screen.getByText('10')).toBeInTheDocument(); // Total points
    });

    it('should display important instructions on the start screen', () => {
      render(<QuizTaker quiz={mockQuiz} />);

      expect(screen.getByText('Important Instructions')).toBeInTheDocument();
      expect(
        screen.getByText(/Read each question carefully before submitting your answer/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You can only answer each question once - no going back!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Questions must be answered in order/i)
      ).toBeInTheDocument();
    });

    it('should have a Start Quiz button that is initially enabled', () => {
      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('Starting the Quiz', () => {
    it('should call startQuizAttempt when Start Quiz button is clicked', async () => {
      const mockAttemptId = 'attempt1';
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: mockAttemptId,
      });

      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(quizAttemptApi.startQuizAttempt).toHaveBeenCalledWith('quiz1');
      });
    });

    it('should display the quiz content after quiz attempt is started', async () => {
      const mockAttemptId = 'attempt1';
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: mockAttemptId,
      });

      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      });
    });

    it('should handle error when quiz start fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockRejectedValue(
        new Error('Failed to start quiz')
      );

      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      // Wait for loading to complete - should stay on start screen
      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });

      // Start screen should still be visible after error
      expect(screen.getByText('Ready to Test Your Knowledge?')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should disable Start Quiz button while loading', async () => {
      let resolveStart: any;
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveStart = resolve;
          })
      );

      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });

      resolveStart({ _id: 'attempt1' });
    });
  });

  describe('Quiz Progress', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should display question progress counter', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument();
        expect(screen.getByText(/1\/1/)).toBeInTheDocument();
      });
    });

    it('should display progress bar', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show question count in progress visualization', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      const startButton = screen.getByRole('button', { name: /Start Quiz/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/0 of 1 answered/)).toBeInTheDocument();
      });
    });
  });

  describe('Question Answering - Multiple Choice', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
      (quizAttemptApi.submitQuizAttempt as jest.Mock).mockResolvedValue({});
    });

    it('should display question text and options', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
        expect(screen.getByLabelText('London')).toBeInTheDocument();
        expect(screen.getByLabelText('Paris')).toBeInTheDocument();
        expect(screen.getByLabelText('Berlin')).toBeInTheDocument();
      });
    });

    it('should allow selecting a multiple choice option', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const parisOption = screen.getByLabelText('Paris') as HTMLInputElement;
        expect(parisOption.checked).toBe(false);

        fireEvent.click(parisOption);
        expect(parisOption.checked).toBe(true);
      });
    });

    it('should disable submit button when no option is selected', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when an option is selected', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should call submitAnswer with correct payload when answer is submitted', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quizAttemptApi.submitAnswer).toHaveBeenCalledWith('attempt1', {
          questionId: 'q1',
          selectedOptionIds: ['opt2'],
        });
      });
    });

    it('should submit quiz automatically when last question is answered', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quizAttemptApi.submitQuizAttempt).toHaveBeenCalledWith('attempt1');
      });
    });

    it('should redirect to attempts page after quiz submission', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/learner/quizzes/quiz1/attempts');
      });
    });
  });

  describe('Question Answering - Multiple Select', () => {
    const multiSelectQuestion: Question = {
      _id: 'q2',
      text: 'Which of these are capital cities?',
      type: QuestionType.MULTIPLE_SELECT,
      score: 15,
      options: [
        { _id: 'opt1', text: 'Paris', correct: true },
        { _id: 'opt2', text: 'London', correct: true },
        { _id: 'opt3', text: 'Manchester', correct: false },
      ],
    };

    const multiSelectQuiz: Quiz = {
      ...mockQuiz,
      questions: [multiSelectQuestion],
    };

    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should display select all correct answers message', async () => {
      render(<QuizTaker quiz={multiSelectQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText('Select all correct answers')).toBeInTheDocument();
      });
    });

    it('should allow selecting multiple options', async () => {
      render(<QuizTaker quiz={multiSelectQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const parisCheckbox = screen.getByLabelText('Paris') as HTMLInputElement;
        const londonCheckbox = screen.getByLabelText('London') as HTMLInputElement;

        fireEvent.click(parisCheckbox);
        fireEvent.click(londonCheckbox);

        expect(parisCheckbox.checked).toBe(true);
        expect(londonCheckbox.checked).toBe(true);
      });
    });

    it('should submit multiple selected options', async () => {
      render(<QuizTaker quiz={multiSelectQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
        fireEvent.click(screen.getByLabelText('London'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quizAttemptApi.submitAnswer).toHaveBeenCalledWith('attempt1', {
          questionId: 'q2',
          selectedOptionIds: ['opt1', 'opt2'],
        });
      });
    });
  });

  describe('Question Answering - True/False', () => {
    const trueFalseQuestion: Question = {
      _id: 'q3',
      text: 'The Earth is flat.',
      type: QuestionType.TRUE_FALSE,
      score: 5,
      correctAnswerBoolean: false,
    };

    const trueFalseQuiz: Quiz = {
      ...mockQuiz,
      questions: [trueFalseQuestion],
    };

    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should display True and False buttons', async () => {
      render(<QuizTaker quiz={trueFalseQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const trueButton = buttons.find((btn) => btn.textContent?.includes('True'));
        const falseButton = buttons.find((btn) => btn.textContent?.includes('False'));

        expect(trueButton).toBeInTheDocument();
        expect(falseButton).toBeInTheDocument();
      });
    });

    it('should submit True/False answer correctly', async () => {
      render(<QuizTaker quiz={trueFalseQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const falseButton = buttons.find((btn) => btn.textContent?.includes('False'));
        fireEvent.click(falseButton!);
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quizAttemptApi.submitAnswer).toHaveBeenCalledWith('attempt1', {
          questionId: 'q3',
          correctAnswerBoolean: false,
        });
      });
    });
  });

  describe('Question Answering - Short Answer', () => {
    const shortAnswerQuestion: Question = {
      _id: 'q4',
      text: 'What is the capital of France?',
      type: QuestionType.SHORT_ANSWER,
      score: 20,
      correctAnswerText: 'Paris',
    };

    const shortAnswerQuiz: Quiz = {
      ...mockQuiz,
      questions: [shortAnswerQuestion],
    };

    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should display textarea for short answer input', async () => {
      render(<QuizTaker quiz={shortAnswerQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
      });
    });

    it('should allow entering text in textarea', async () => {
      render(<QuizTaker quiz={shortAnswerQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your answer here...') as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: 'Paris' } });
        expect(textarea.value).toBe('Paris');
      });
    });

    it('should submit text answer correctly', async () => {
      render(<QuizTaker quiz={shortAnswerQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your answer here...');
        fireEvent.change(textarea, { target: { value: 'Paris' } });
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(quizAttemptApi.submitAnswer).toHaveBeenCalledWith('attempt1', {
          questionId: 'q4',
          textAnswer: 'Paris',
        });
      });
    });
  });

  describe('Multiple Question Quiz', () => {
    const question1: Question = {
      _id: 'q1',
      text: 'Question 1?',
      type: QuestionType.MULTIPLE_CHOICE,
      score: 10,
      options: [
        { _id: 'opt1', text: 'Option 1', correct: true },
        { _id: 'opt2', text: 'Option 2', correct: false },
      ],
    };

    const question2: Question = {
      _id: 'q2',
      text: 'Question 2?',
      type: QuestionType.TRUE_FALSE,
      score: 10,
      correctAnswerBoolean: true,
    };

    const multiQuestionQuiz: Quiz = {
      ...mockQuiz,
      questions: [question1, question2],
    };

    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should navigate to next question after answering', async () => {
      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText('Question 1?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Option 1'));
      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Question 2?')).toBeInTheDocument();
        expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
      });
    });

    it('should update progress counter as questions are answered', async () => {
      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText(/0 of 2 answered/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Option 1'));
      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 answered/)).toBeInTheDocument();
      });
    });

    it('should display "Submit Quiz" button on last question', async () => {
      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Option 1'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submit Quiz/i })).toBeInTheDocument();
      });
    });

    it('should display final warning message on last question', async () => {
      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Option 1'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/This is the final question. Quiz will submit automatically./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
    });

    it('should handle answer submission failure gracefully', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      (quizAttemptApi.submitAnswer as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to save answer. Please try again.');
      });

      alertSpy.mockRestore();
    });

    it('should handle already answered question error', async () => {
      (quizAttemptApi.submitAnswer as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'This question has already been answered',
          },
        },
      });
      (quizAttemptApi.submitQuizAttempt as jest.Mock).mockResolvedValue({});

      const multiQuestionQuiz: Quiz = {
        ...mockQuiz,
        questions: [
          { ...mockQuestion, _id: 'q1' },
          { ...mockQuestion, _id: 'q2', text: 'Question 2?' },
        ],
      };

      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Question 2?')).toBeInTheDocument();
      });
    });

    it('should handle quiz submission failure', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
      (quizAttemptApi.submitQuizAttempt as jest.Mock).mockRejectedValue(new Error('Failed to submit'));

      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to submit quiz. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Question Type Display', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
    });

    it('should display correct question type badge', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
      });
    });

    it('should display question score', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByText(/10 pt/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
    });

    it('should show loading spinner while submitting answer', async () => {
      let resolveSubmit: any;
      (quizAttemptApi.submitAnswer as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          })
      );

      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Quiz/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Saving.../)).toBeInTheDocument();
      });

      resolveSubmit({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle quiz with no questions gracefully', () => {
      const emptyQuiz: Quiz = {
        ...mockQuiz,
        questions: [],
      };

      render(<QuizTaker quiz={emptyQuiz} />);

      // Should display loading state since no question available
      expect(screen.getByText(/Loading quiz.../i)).toBeInTheDocument();
    });

    it('should handle undefined quiz gracefully', () => {
      render(<QuizTaker quiz={undefined as any} />);

      expect(screen.getByText(/Loading quiz.../i)).toBeInTheDocument();
    });

    it('should clear current answer value when moving to next question', async () => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});

      const multiQuestionQuiz: Quiz = {
        ...mockQuiz,
        questions: [
          { ...mockQuestion, _id: 'q1' },
          { ...mockQuestion, _id: 'q2', text: 'Second question' },
        ],
      };

      render(<QuizTaker quiz={multiQuestionQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      // Answer first question
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText('Paris'));
      });

      const submitButton = await screen.findByRole('button', { name: /Submit Answer/i });
      fireEvent.click(submitButton);

      // Move to second question
      await waitFor(() => {
        expect(screen.getByText('Second question')).toBeInTheDocument();
        // The next question should have no selected option
        const partsCheckbox = screen.queryByLabelText('Paris') as HTMLInputElement;
        expect(partsCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (quizAttemptApi.startQuizAttempt as jest.Mock).mockResolvedValue({
        _id: 'attempt1',
      });
      (quizAttemptApi.submitAnswer as jest.Mock).mockResolvedValue({});
    });

    it('should have proper form elements with labels', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('London')).toBeInTheDocument();
        expect(screen.getByLabelText('Paris')).toBeInTheDocument();
        expect(screen.getByLabelText('Berlin')).toBeInTheDocument();
      });
    });

    it('should have descriptive button text', async () => {
      render(<QuizTaker quiz={mockQuiz} />);

      fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submit Quiz/i })).toBeInTheDocument();
      });
    });
  });
});
