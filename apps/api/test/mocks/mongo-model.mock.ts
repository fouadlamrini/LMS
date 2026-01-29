export const mockModelFactory = () => ({
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
    lean: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
});