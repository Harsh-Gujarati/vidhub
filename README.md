# PromptLunarX - Civitai Media Gallery

A stunning, modern web application for browsing and discovering videos and images from Civitai's extensive media library.

## 🌟 Features

- **Dynamic Media Gallery**: Browse videos and images with infinite scroll
- **Advanced Filtering**: Filter by content type, period, and sort options
- **Premium Content Indicators**: Clear badges for paid/premium content
- **Responsive Design**: Beautiful UI that works on all devices
- **Dark Mode**: Sleek, modern dark theme with glassmorphism effects
- **CORS Proxy**: Built-in proxy server to bypass API restrictions
- **Smooth Animations**: Micro-animations for enhanced user experience

## 🚀 Live Demo

Visit the live site: [Your Vercel URL will appear here after deployment]

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js (Express proxy server)
- **API**: Civitai API
- **Deployment**: Vercel
- **Version Control**: Git & GitHub

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Harsh-Gujarati/vidhub.git
cd vidhub
```

2. Install dependencies:
```bash
npm install
```

3. Run the proxy server:
```bash
node proxy.js
```

4. Open `index.html` in your browser or use a local server:
```bash
npx serve .
```

## 🌐 Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy with one click!

## 📁 Project Structure

```
vidhub/
├── index.html          # Main HTML file
├── index.css           # Styles and design system
├── app.js              # Frontend JavaScript logic
├── proxy.js            # CORS proxy server
├── vercel.json         # Vercel configuration
├── package.json        # Node.js dependencies
└── README.md           # Project documentation
```

## 🎨 Design Features

- Modern glassmorphism UI
- Vibrant gradient accents
- Smooth hover effects and transitions
- Custom scrollbar styling
- Responsive grid layouts
- Premium typography (Inter font family)

## 🔧 Configuration

The app uses the Civitai API with the following endpoints:
- Videos: `/api/v1/videos`
- Images: `/api/v1/images`

Proxy server runs on port 3000 by default.

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 👨‍💻 Author

**Harsh Gujarati**
- GitHub: [@Harsh-Gujarati](https://github.com/Harsh-Gujarati)

## 🙏 Acknowledgments

- [Civitai](https://civitai.com) for providing the API
- Design inspiration from modern web applications

---

⭐ Star this repo if you find it useful!
