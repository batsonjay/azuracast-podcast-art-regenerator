# Contributing to AzuraCast Podcast Art Regenerator

We welcome contributions to the AzuraCast Podcast Art Regenerator project! This document outlines the process for contributing and the requirements for submitting code.

## Contributor License Agreement

By contributing to this project, you agree to the following terms:

1. **Copyright Assignment**: You assign all copyright interest in your contributions to JAB Ventures, Inc.
2. **License Grant**: You grant JAB Ventures, Inc. a perpetual, worldwide, non-exclusive, royalty-free license to use, modify, and distribute your contributions.
3. **Original Work**: You represent that your contributions are your original work and do not infringe on any third-party rights.
4. **Authority**: You have the legal authority to make this assignment and grant these rights.

This contributor agreement ensures that:
- The project can be maintained under a consistent license
- JAB Ventures, Inc. can make licensing decisions for the project
- The project remains free and open source
- Contributors are protected from legal issues

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use the issue template if available
3. Provide detailed information about:
   - Your environment (Node.js version, OS, AzuraCast version)
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Error messages or logs

### Submitting Code Changes

1. **Fork the Repository**
   ```bash
   git clone https://github.com/jabventures/azuracast-podcast-art-regenerator.git
   cd azuracast-podcast-art-regenerator
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add appropriate comments and documentation
   - Include copyright notices in new files
   - Write or update tests if applicable

4. **Test Your Changes**
   ```bash
   npm install
   npm run test
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add feature: description of your changes"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   - Use the pull request template if available
   - Describe your changes clearly
   - Reference any related issues
   - Include the contributor agreement acknowledgment

### Pull Request Requirements

- [ ] Code follows the project's style guidelines
- [ ] Changes are well-documented
- [ ] New files include appropriate copyright notices
- [ ] Tests pass (if applicable)
- [ ] Pull request description is clear and complete
- [ ] Contributor agreement is acknowledged

## Code Style Guidelines

### JavaScript Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes
- Add JSDoc comments for functions and classes

### File Headers

All new JavaScript files should include this header:

```javascript
/**
 * Brief description of the file
 * Copyright (c) JAB Ventures, Inc., 2025
 * Licensed under GPL v2
 */
```

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally

## Development Setup

1. **Prerequisites**
   - Node.js 14.0.0 or higher
   - npm or yarn
   - Access to an AzuraCast instance for testing

2. **Installation**
   ```bash
   git clone https://github.com/jabventures/azuracast-podcast-art-regenerator.git
   cd azuracast-podcast-art-regenerator
   npm install
   ```

3. **Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your test configuration
   ```

4. **Testing**
   ```bash
   # Run with dry-run mode for testing
   npm run test
   ```

## Project Structure

```
azuracast-podcast-art-regenerator/
├── src/
│   ├── api/           # API client and related utilities
│   ├── services/      # Core business logic services
│   ├── utils/         # Utility functions and helpers
│   └── index.js       # Main entry point
├── data/              # Runtime data (progress, episodes)
├── .env.example       # Environment configuration template
├── LICENSE            # GPL v2 license
├── README.md          # Project documentation
└── package.json       # Node.js package configuration
```

## Types of Contributions

We welcome various types of contributions:

### Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test improvements

### Documentation
- README improvements
- Code comments
- API documentation
- Usage examples
- Troubleshooting guides

### Testing
- Unit tests
- Integration tests
- Manual testing and bug reports
- Performance testing

### Community
- Answering questions in issues
- Helping other contributors
- Improving project processes

## Getting Help

If you need help with contributing:

1. Check the existing documentation
2. Look at similar issues or pull requests
3. Ask questions in GitHub issues
4. Review the AzuraCast API documentation

## Recognition

Contributors will be recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Project documentation where appropriate

## Code of Conduct

This project follows a code of conduct based on respect and inclusivity:

- Be respectful and constructive in all interactions
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## License

By contributing to this project, you agree that your contributions will be licensed under the GNU General Public License v2.0, with copyright assigned to JAB Ventures, Inc.

---

Thank you for contributing to Podcast Art Regenerator! Your contributions help make this tool better for the entire AzuraCast community.
