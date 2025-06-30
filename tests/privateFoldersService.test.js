const fs = require('fs');
const path = require('path');
const { readPrivateFolders, isPrivateFolder, clearPrivateFoldersCache } = require('../services/privateFoldersService');

// Mock fs module
jest.mock('fs');

describe('privateFoldersService', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPrivateFoldersCache();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('readPrivateFolders', () => {
    it('should return default folders when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = readPrivateFolders();
      
      expect(result).toEqual([
        '/1. 일지',
        '/7. 생각정리',
        '/8. 루틴', 
        '/97. 보안 폴더',
        '/98. 미분류',
        '/99. 일기'
      ]);
    });

    it('should parse markdown file with bullet points', () => {
      const mockContent = `# Private Folders
- /Private Notes
- /Draft Articles
* /Personal Files
`;
      
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: { getTime: () => 123456 } });
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = readPrivateFolders();
      
      expect(result).toEqual([
        '/Private Notes',
        '/Draft Articles',
        '/Personal Files'
      ]);
    });

    it('should parse markdown file with direct paths', () => {
      const mockContent = `/Secret Folder
/Another Private Folder
# This is a comment
// This is also a comment

/Third Folder`;
      
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: { getTime: () => 123456 } });
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = readPrivateFolders();
      
      expect(result).toEqual([
        '/Secret Folder',
        '/Another Private Folder',
        '/Third Folder'
      ]);
    });

    it('should normalize paths without leading slash', () => {
      const mockContent = `- Private Notes
- Draft Articles`;
      
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: { getTime: () => 123456 } });
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = readPrivateFolders();
      
      expect(result).toEqual([
        '/Private Notes',
        '/Draft Articles'
      ]);
    });

    it('should use cache when file has not been modified', () => {
      const mockContent = '- /Test Folder';
      const mockTime = 123456;
      
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: { getTime: () => mockTime } });
      fs.readFileSync.mockReturnValue(mockContent);
      
      // First call
      const result1 = readPrivateFolders();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const result2 = readPrivateFolders();
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should reload when file is modified', () => {
      const mockContent1 = '- /Test Folder 1';
      const mockContent2 = '- /Test Folder 2';
      
      fs.existsSync.mockReturnValue(true);
      
      // First call
      fs.statSync.mockReturnValueOnce({ mtime: { getTime: () => 123456 } });
      fs.readFileSync.mockReturnValueOnce(mockContent1);
      const result1 = readPrivateFolders();
      
      // Second call with modified file
      fs.statSync.mockReturnValueOnce({ mtime: { getTime: () => 654321 } });
      fs.readFileSync.mockReturnValueOnce(mockContent2);
      const result2 = readPrivateFolders();
      
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(['/Test Folder 1']);
      expect(result2).toEqual(['/Test Folder 2']);
    });

    it('should return default folders when file read fails', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockImplementation(() => {
        throw new Error('File access error');
      });
      
      const result = readPrivateFolders();
      
      expect(result).toEqual([
        '/1. 일지',
        '/7. 생각정리',
        '/8. 루틴', 
        '/97. 보안 폴더',
        '/98. 미분류',
        '/99. 일기'
      ]);
    });
  });

  describe('isPrivateFolder', () => {
    beforeEach(() => {
      const mockContent = `- /Private
- /Secret`;
      
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ mtime: { getTime: () => 123456 } });
      fs.readFileSync.mockReturnValue(mockContent);
    });

    it('should return true for private folder paths', () => {
      expect(isPrivateFolder('/Private')).toBe(true);
      expect(isPrivateFolder('/Private/subfolder')).toBe(true);
      expect(isPrivateFolder('/Secret')).toBe(true);
      expect(isPrivateFolder('/Secret/document.md')).toBe(true);
    });

    it('should return false for non-private folder paths', () => {
      expect(isPrivateFolder('/Public')).toBe(false);
      expect(isPrivateFolder('/Docs')).toBe(false);
      expect(isPrivateFolder('/Open/file.md')).toBe(false);
    });
  });
});