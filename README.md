# AI Sprite Studio
![image](https://github.com/user-attachments/assets/f0a67625-5e65-4940-9ed3-0140d9e22e5d)

## Overview
The **AI Sprite Studio** is a React-based application that allows users to extract, classify, and preview sprite animations from sprite sheets. The application leverages IndexedDB for storing spritesheets and includes deep integration with **Ollama AI** for automatic animation classification.

## Features
- **Sprite Sheet Upload**: Upload and store sprite sheets in IndexedDB.
- **Automatic Background Detection**: Detect and remove background colors.
- **Sprite Extraction**: Extract individual sprites using different detection methods.
- **Ollama AI Classification**: Classify animations using advanced AI models.
- **Grouping**: Group sprites by row, column, or using Ollama classification.
- **Animation Preview**: Play animations with adjustable frame rates.
- **Save & Manage Animations**: Store and organize animations in IndexedDB.

## Installation
### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- **Ollama AI** running locally on port `11434`. Follow the [official Ollama documentation](https://ollama.ai/) for setup.

### Clone the Repository
```sh
git clone https://github.com/avnigashi/ai-sprite-studio.git
cd ai-sprite-studio
```

### Install Dependencies
```sh
npm install
```
or
```sh
yarn install
```

### Start the Development Server
```sh
npm start
```
or
```sh
yarn start
```
The application should now be accessible at `http://localhost:3000/`.

## Usage
### Uploading a Sprite Sheet
1. Click the **Upload Spritesheet** button.
2. Select a `.png` or `.jpg` file.
3. The image will be stored in IndexedDB.

### Extracting Sprites
1. Adjust the extraction settings (tolerance, min width, height, etc.).
2. Click **Detect Sprites** to extract frames.

### Classifying Animations with Ollama
1. Ensure Ollama is running on `localhost:11434`.
2. Select **Grouping Method** -> `Ollama`.
3. Choose a model (filtered to show `mllama` or `clip` families).
4. Click **Detect Sprites** to classify animations.
5. The extracted animations will be tagged with AI-generated labels.

### Playing Animations
1. Select an animation from the detected list.
2. Click **Play** to preview the animation.

### Saving Animations
1. Assign a name to the detected animation sequence.
2. Click **Save All Animations** to store them.

## Configuration
### Ollama AI Setup
Ollama AI must be running locally on port `11434`. If needed, install Ollama following the [official documentation](https://ollama.ai/).

## Project Structure
```
📁 ai-sprite-studio/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── ProgressBar.js
│   │   ├── SpriteAnimationsTab.js
│   ├── 📁 models/
│   │   ├── gameModels.js
│   ├── 📁 db/
│   │   ├── index.js (IndexedDB setup)
├── 📄 package.json
├── 📄 README.md
```

## Dependencies
- **React**: UI Framework
- **Dexie.js**: IndexedDB wrapper
- **Bootstrap**: UI components
- **Ollama AI**: Advanced AI model integration

## License
This project is licensed under the MIT License. See `LICENSE` for details.

## Contributing
1. Fork the repository.
2. Create a new feature branch.
3. Commit changes and push to your fork.
4. Open a Pull Request.

## Contact
For issues or feature requests, please open an issue on GitHub or contact the maintainer at `your_email@example.com`.

