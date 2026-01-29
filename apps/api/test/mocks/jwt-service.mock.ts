export const mockJwtService = {
    sign: jest.fn().mockImplementation((payload) => {
        // Returns a "fake" token string based on the role for easy debugging
        return `mock_token_${payload.role}`;
    }),
    verify: jest.fn(),
    decode: jest.fn(),
};

// Helper for tests that need a specific decoded payload
export const mockJwtPayload = (role: string) => ({
    sub: '65a1234567890abcdef12345',
    email: `${role}@example.com`,
    role: role,
    fullName: `Mock ${role}`,
});