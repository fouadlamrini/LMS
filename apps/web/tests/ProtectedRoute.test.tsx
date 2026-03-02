import { render, screen } from "@testing-library/react";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { Role } from "@/types/enums";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock AuthProvider at module level
const mockUseAuth = jest.fn();

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows 403 when user has wrong role", () => {
    mockUseAuth.mockReturnValue({
      user: { role: Role.LEARNER },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/403 - access denied/i)).toBeInTheDocument();
  });

  it("renders children when user is authorized", () => {
    mockUseAuth.mockReturnValue({
      user: { role: Role.ADMIN },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/admin content/i)).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText(/admin content/i)).not.toBeInTheDocument();
  });

  it("redirects when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText(/admin content/i)).not.toBeInTheDocument();
  });
});