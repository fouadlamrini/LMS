import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import { AuthProvider } from "@/providers/AuthProvider";
import React from "react";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

// Mock useAuth hook
const mockLogin = jest.fn();

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows validation error when fields are empty", async () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    // Click submit button without filling fields
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      // Check for actual error messages based on the HTML output
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("calls login function when form is submitted with valid data", async () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Fill in valid data
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit form
    fireEvent.click(submitButton);

    // Wait for login to be called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows invalid email error for malformed email", async () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it("shows password length error for short password", async () => {
    render(<LoginPage />, { wrapper: TestWrapper });

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Enter valid email but short password
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });
});