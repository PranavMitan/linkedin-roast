// This script runs on LinkedIn pages
console.log('LinkedIn Post Roaster: Content script loaded');

// Initialize AI Service
const aiService = new AIService();
console.log('AI Service initialized');

// Update the selectors to match LinkedIn's current structure
const LINKEDIN_SELECTORS = {
    POST: '.update-components-text, .feed-shared-update-v2, .update-components-article',
    ACTIONS: '.update-components-action-bar, .feed-shared-social-action-bar, .social-actions',
    POST_CONTENT: '.update-components-text__text-view, .feed-shared-text, .update-components-text'
};

// Track processed posts to avoid duplicates
const processedPosts = new Set();

// Create and inject our roast button styles
const style = document.createElement('style');
style.textContent = `
  .roast-button-container {
    display: inline-flex;
    margin: 0;
    padding: 0;
  }

  .roast-button {
    min-height: 32px;
    background: transparent;
    color: rgba(0, 0, 0, 0.6);
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 8px;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue","Fira Sans",Ubuntu,Oxygen,"Oxygen Sans",Cantarell,"Droid Sans","Apple Color Emoji","Segoe UI Emoji","Segoe UI Emoji","Segoe UI Symbol","Lucida Grande",Helvetica,Arial,sans-serif;
    line-height: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.167s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 4px;
    opacity: 1 !important;
  }
  
  .roast-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
    color: rgba(0, 0, 0, 0.9);
  }

  .roast-button[disabled] {
    cursor: not-allowed;
    opacity: 0.6 !important;
    color: rgba(0, 0, 0, 0.6);
  }

  .roast-button span {
    font-size: 16px;
    line-height: 1;
  }

  .roast-button span:last-child {
    color: rgba(0, 0, 0, 0.6);
    font-weight: 600;
  }

  .roast-button:hover span:last-child {
    color: rgba(0, 0, 0, 0.9);
  }

  .roast-result {
    background: #FFF3E0;
    padding: 16px;
    margin: 12px 0;
    border-radius: 8px;
    font-size: 14px;
    color: #333;
    border-left: 4px solid #FFB74D;
    position: relative;
    z-index: 1;
  }

  .roast-result::before {
    content: '🔥 AI Roast';
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #F57C00;
  }

  /* Toast Notification Styles */
  .linkedin-roast-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .linkedin-roast-toast {
    background: #ffffff;
    color: #333333;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    font-size: 14px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 380px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out forwards;
    border-left: 4px solid #F57C00;
  }

  .linkedin-roast-toast.error {
    border-left-color: #e57373;
  }

  .linkedin-roast-toast.warning {
    border-left-color: #FFB74D;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .linkedin-roast-toast-close {
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    margin-left: auto;
    font-size: 18px;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .linkedin-roast-toast-close:hover {
    opacity: 1;
  }

  .linkedin-roast-toast-message {
    flex-grow: 1;
  }
`;

// Toast notification system
const toastMessages = {
    API_KEY_INVALID: "Oops! Your API key took a coffee break. Time to wake it up! 🥱 Our team's on it!",
    CREDITS_EXHAUSTED: "Your roasting credits need a refill! Time to top up your OpenAI account! 💰 We're here to help!",
    RATE_LIMIT: "Whoa there! You're roasting faster than my coffee machine. Take a breather! ⏰ Back to normal soon!",
    NETWORK_ERROR: "Internet playing hide and seek? Can't roast without my Wi-Fi bestie! 🌐 We're troubleshooting!",
    EMPTY_POST: "Found a ghost post! Need actual content to roast, not thin air! 👻 Try again in a bit!",
    POST_TOO_LONG: "This post is longer than my attention span. Keep it LinkedIn, not War & Peace! 📚 We're optimizing!",
    API_DOWN: "Our roasting machine is taking a power nap. Back to burning soon! 😴 Engineers are on it!",
    CONTEXT_LOST: "Having an identity crisis! Try refreshing the page. 🔄 We're investigating!",
    UNSUPPORTED_FORMAT: "This post is speaking a language I don't understand yet! 🤔 Updates coming soon!",
    CACHE_ERROR: "My memory is getting fuzzy. A quick refresh should help! 🧠 We're fixing this!",
    RAPID_REQUESTS: "Easy tiger! One roast at a time - I'm not a comedy machine gun! 🎯 Working on speed!",
    CONTENT_MODERATION: "This post is too spicy even for my roasting skills! 🌶️ We're adjusting the heat!",
    BROWSER_COMPATIBILITY: "Your browser and I need couples therapy. Try Chrome! 💝 Support expanding soon!",
    DOM_CHANGED: "LinkedIn got a makeover and I'm confused. 💅 Updates dropping soon!",
    PERMISSIONS_ERROR: "I need permission to roast! Check your extension settings. 🔑 Guide coming soon!",
    UNKNOWN_ERROR: "Even roasters have bad days. Let's try that again! 🎭 We're on the case!"
};

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'linkedin-roast-toast-container';
    document.body.appendChild(container);
    return container;
}

function showToast(messageKey, type = 'error', duration = 5000) {
    const message = toastMessages[messageKey] || toastMessages.UNKNOWN_ERROR;
    const container = document.querySelector('.linkedin-roast-toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `linkedin-roast-toast ${type}`;
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'linkedin-roast-toast-message';
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'linkedin-roast-toast-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close notification');
    
    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);
    container.appendChild(toast);
    
    const removeToast = () => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            container.removeChild(toast);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    };
    
    closeButton.addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
    
    // Accessibility
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
}

function insertRoastButton(post) {
    // Check if post already has a roast button
    if (post.querySelector('.roast-button')) return false;

    const button = createRoastButton(post);
    const actionsContainer = post.querySelector(LINKEDIN_SELECTORS.ACTIONS);
    
    if (actionsContainer) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'roast-button-container';
        buttonContainer.appendChild(button);
        
        // Insert after the last action button
        const lastAction = actionsContainer.lastElementChild;
        if (lastAction) {
            lastAction.after(buttonContainer);
            return true;
        }
    }
    
    return false;
}

// Replace the mockGenerateRoast function with real AI integration

async function generateRoast(postText) {
    try {
        console.log('Attempting to generate roast for:', postText.substring(0, 100) + '...');
        const roast = await aiService.generateRoast(postText);
        if (!roast) {
            throw new Error('No roast generated');
        }
        return roast;
    } catch (error) {
        console.error('AI Roast generation failed:', error.message);
        throw error; // Don't fall back to mock roasts, let the error propagate
    }
}

function createRoastButton(post) {
    const button = document.createElement('button');
    button.className = 'roast-button';
    button.innerHTML = `
        <span>🔥</span>
        <span style="font-size: 14px;">Roast</span>
    `;
    
    button.addEventListener('click', async () => {
        // Remove existing roasts
        post.querySelectorAll('.roast-result').forEach(el => el.remove());
        
        button.disabled = true;
        button.innerHTML = `
            <span>🤔</span>
            <span style="font-size: 14px;">Roasting...</span>
        `;

        try {
            // First, find and click the "more" button if it exists
            const expandButton = post.querySelector('.feed-shared-inline-show-more-text__button, .see-more');
            if (expandButton) {
                expandButton.click();
                // Wait longer for the expansion animation to complete
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Now get the post content after expansion
            const postContent = post.querySelector(LINKEDIN_SELECTORS.POST_CONTENT);
            const postText = postContent?.textContent.trim();
            
            if (!postText) {
                showToast('EMPTY_POST');
                throw new Error('No post content found');
            }

            const roast = await generateRoast(postText);
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'roast-result';
            resultDiv.textContent = roast;
            
            // Insert after the post content
            if (postContent) {
                postContent.parentNode.insertBefore(resultDiv, postContent.nextSibling);
                
                // Wait a bit for the DOM to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Find the expanded post container and scroll it into view instead
                const postContainer = post.querySelector('.feed-shared-update-v2__description-wrapper, .feed-shared-text');
                if (postContainer) {
                    postContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
            
            button.disabled = false;
            button.innerHTML = `
                <span>🔥</span>
                <span style="font-size: 14px;">Roast again</span>
            `;
        } catch (error) {
            console.error('Roast generation failed:', error);
            
            // If it's not a known error that already showed a toast, show unknown error
            if (!error.message.includes('No post content found')) {
                showToast('UNKNOWN_ERROR');
            }
            
            button.innerHTML = `
                <span>❌</span>
                <span style="font-size: 14px;">Failed</span>
            `;
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = `
                    <span>🔥</span>
                    <span style="font-size: 14px;">Roast</span>
                `;
            }, 2000);
        }
    });

    return button;
}

function processNewPosts() {
    const posts = document.querySelectorAll(LINKEDIN_SELECTORS.POST);
    console.log('Found posts:', posts.length); // Debug log
    
    posts.forEach(post => {
        if (processedPosts.has(post)) return;
        processedPosts.add(post);
        
        const success = insertRoastButton(post);
        console.log('Button inserted:', success); // Debug log
    });
}

let observer;

function initializeRoaster() {
    // Remove any existing styles and buttons
    document.querySelectorAll('.roast-button, .roast-result').forEach(el => el.remove());
    processedPosts.clear();
    
    // Add styles
    if (!document.head.contains(style)) {
        document.head.appendChild(style);
    }
    
    // Initial process
    processNewPosts();

    // Set up mutation observer
    if (observer) {
        observer.disconnect();
    }
    
    observer = new MutationObserver((mutations) => {
        const hasNewPosts = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && (
                    node.matches?.(LINKEDIN_SELECTORS.POST) ||
                    node.querySelector?.(LINKEDIN_SELECTORS.POST)
                )
            )
        );
        
        if (hasNewPosts) {
            processNewPosts();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Update the initialization to retry a few times
function initializeWithRetry(retries = 3, delay = 2000) {
    console.log('Attempting to initialize roaster...');
    
    const attempt = () => {
        const posts = document.querySelectorAll(LINKEDIN_SELECTORS.POST);
        console.log(`Found ${posts.length} posts`);
        
        if (posts.length > 0) {
            initializeRoaster();
        } else if (retries > 0) {
            console.log(`No posts found, retrying in ${delay}ms... (${retries} retries left)`);
            setTimeout(() => initializeWithRetry(retries - 1, delay), delay);
        } else {
            console.log('Failed to find posts after all retries');
        }
    };

    attempt();
}

// Update the initialization code
chrome.storage.local.get(['roasterEnabled'], function(result) {
    console.log('Extension state:', result.roasterEnabled);
    if (result.roasterEnabled) {
        initializeWithRetry();
    }
});

// Update the state change listener
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.roasterEnabled) {
        console.log('Extension state changed:', changes.roasterEnabled.newValue);
        if (changes.roasterEnabled.newValue) {
            initializeWithRetry();
        } else {
            document.querySelectorAll('.roast-button, .roast-result').forEach(el => el.remove());
            processedPosts.clear();
            if (observer) observer.disconnect();
        }
    }
});

// Mock function for generating roasts (we'll replace this with AI later)
async function mockGenerateRoast(postText) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRoasts = [
        "This post is so corporate, it probably has its own LinkedIn profile.",
        "I've seen more authenticity in a stock photo.",
        "Did an AI write this? Because it's peak LinkedIn cringe.",
        "This is what happens when you let motivational posters write your content.",
        "Congratulations on winning 'Most LinkedIn Post Ever'! 🏆",
    ];
    
    return mockRoasts[Math.floor(Math.random() * mockRoasts.length)];
}
 