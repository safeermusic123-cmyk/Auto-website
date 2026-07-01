// Cinematic Scroll Animation & Interactive Controller

document.addEventListener('DOMContentLoaded', () => {
    // --- State and Constants ---
    const frameCount = 192;
    const images = [];
    let loadedCount = 0;
    
    // Smooth scrolling easing states
    const animationState = {
        targetProgress: 0,  // From 0 to 1 based on actual scroll of the hero container
        currentProgress: 0, // Interpolated value for smooth transition
        easing: 0.1         // Easing constant (tweak for smoothness)
    };

    // --- DOM Elements ---
    const canvas = document.getElementById('animation-canvas');
    const ctx = canvas.getContext('2d');
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBarFill = document.getElementById('loader-bar-fill');
    const mainHeader = document.getElementById('main-header');
    const heroScrollContainer = document.querySelector('.hero-scroll-container');

    // --- Image URL Generator ---
    const getFrameUrl = (index) => {
        const paddedIndex = String(index).padStart(6, '0');
        return `frame_${paddedIndex}.jpg`;
    };

    // --- Initial Layout Setup ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight; // Fill screen height on all devices
        renderFrame(animationState.currentProgress);
    }
    window.addEventListener('resize', resizeCanvas);

    // --- Preload Images ---
    function preloadFrames() {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                updatePreloader();
            };
            img.onerror = () => {
                console.error(`Failed to load frame ${i}`);
                loadedCount++;
                updatePreloader();
            };
            img.src = getFrameUrl(i);
            images.push(img);
        }
    }

    function updatePreloader() {
        const percentage = (loadedCount / frameCount) * 100;
        if (loaderBarFill) {
            loaderBarFill.style.width = `${percentage}%`;
        }

        if (loadedCount === frameCount) {
            setTimeout(() => {
                loaderOverlay.classList.add('fade-out');
                resizeCanvas();
                requestAnimationFrame(tick);
            }, 600);
        }
    }

    // --- Image Aspect Ratio Cover/Zoom Utility ---
    function drawImageProp(img) {
        if (!img || !img.complete) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isMobile = window.innerWidth < 768;
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        
        let sx, sy, sWidth, sHeight;
        let dx, dy, dWidth, dHeight;
        
        if (isMobile) {
            // Option B: Slightly Zoomed Fit (Scale up contain mode by 1.4x)
            // This fills more of the vertical screen height while keeping the car in full view
            const zoomFactor = 1.4;
            
            if (imgAspect > canvasAspect) {
                // Image is wider than portrait canvas (fit width * zoom)
                dWidth = canvas.width * zoomFactor;
                dHeight = dWidth / imgAspect;
                dx = (canvas.width - dWidth) / 2;
                dy = (canvas.height - dHeight) / 2;
            } else {
                dHeight = canvas.height * zoomFactor;
                dWidth = dHeight * imgAspect;
                dx = (canvas.width - dWidth) / 2;
                dy = (canvas.height - dHeight) / 2;
            }
            ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dWidth, dHeight);
        } else {
            // Desktop 'cover' logic
            if (imgAspect > canvasAspect) {
                sHeight = img.height;
                sWidth = img.height * canvasAspect;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = img.width;
                sHeight = img.width / canvasAspect;
                sx = 0;
                sy = (img.height - sHeight) / 2;
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        }
    }

    // --- Render Frame ---
    function renderFrame(progress) {
        const frameIndex = Math.min(
            frameCount - 1,
            Math.max(0, Math.floor(progress * frameCount))
        );
        
        const img = images[frameIndex];
        if (img) {
            drawImageProp(img);
        }
    }

    // --- Main Tick/Loop ---
    function tick() {
        if (!heroScrollContainer) return;

        // Calculate max scrollable height within the hero container only
        const maxHeroScroll = heroScrollContainer.offsetHeight - window.innerHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        // Calculate target progress (0 to 1) for the hero frame animation
        animationState.targetProgress = maxHeroScroll <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / maxHeroScroll));

        // Smooth Lerp easing
        const diff = animationState.targetProgress - animationState.currentProgress;
        animationState.currentProgress += diff * animationState.easing;
        
        // Clamp current progress
        animationState.currentProgress = Math.min(1, Math.max(0, animationState.currentProgress));

        // Render current animation frame
        renderFrame(animationState.currentProgress);

        // Sticky Header visibility control: fade in/out near the end of scroll animation
        if (scrollTop >= maxHeroScroll * 0.92) {
            mainHeader.classList.add('visible');
        } else {
            mainHeader.classList.remove('visible');
        }

        requestAnimationFrame(tick);
    }

    // --- Before & After Interactive Slider & Tabs ---
    const sliderContainer = document.getElementById('before-after-container');
    const afterImageContainer = document.getElementById('after-image-container');
    const sliderHandle = document.getElementById('slider-handle');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sliderBeforeImg = document.getElementById('slider-before-img');
    const sliderAfterImg = document.getElementById('slider-after-img');
    const sliderBeforeLabel = document.getElementById('slider-before-label');
    const sliderAfterLabel = document.getElementById('slider-after-label');

    if (sliderContainer && afterImageContainer && sliderHandle) {
        let isDragging = false;

        const updateSlider = (clientX) => {
            const rect = sliderContainer.getBoundingClientRect();
            let percentage = ((clientX - rect.left) / rect.width) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            
            afterImageContainer.style.clipPath = `inset(0 0 0 ${percentage}%)`;
            sliderHandle.style.left = `${percentage}%`;
        };

        // Mouse Events
        sliderContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateSlider(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateSlider(e.clientX);
            }
        });

        // Touch Events (Mobile) - Added preventDefault to block page scrolling while dragging
        sliderContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            if (e.touches.length > 0) {
                updateSlider(e.touches[0].clientX);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length > 0) {
                if (e.cancelable) {
                    e.preventDefault(); // Prevent standard page scroll
                }
                updateSlider(e.touches[0].clientX);
            }
        }, { passive: false });

        // Tab Switching Logic
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;
                
                // Remove active classes
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const target = btn.getAttribute('data-target');

                // Smooth swap transition
                sliderContainer.style.opacity = '0.3';
                
                setTimeout(() => {
                    if (target === 'paint') {
                        sliderBeforeImg.src = 'car_before.jpg';
                        sliderBeforeImg.alt = 'Car before detailing';
                        sliderAfterImg.src = 'car_after.jpg';
                        sliderAfterImg.alt = 'Car after detailing';
                        sliderBeforeLabel.textContent = 'BEFORE DETAIL';
                        sliderAfterLabel.textContent = 'AFTER APEX DETAIL';
                    } else if (target === 'wrap') {
                        sliderBeforeImg.src = 'car_wrap_before.jpg';
                        sliderBeforeImg.alt = 'Car factory paint';
                        sliderAfterImg.src = 'car_wrap_after.jpg';
                        sliderAfterImg.alt = 'Car satin vinyl wrap';
                        sliderBeforeLabel.textContent = 'FACTORY PAINT';
                        sliderAfterLabel.textContent = 'SATIN VINYL WRAP';
                    }

                    // Reset slider split back to 50%
                    afterImageContainer.style.clipPath = 'inset(0 0 0 50%)';
                    sliderHandle.style.left = '50%';
                    
                    // Fade back in
                    sliderContainer.style.opacity = '1';
                }, 220);
            });
        });
    }

    // --- Premium Word-by-Word Text Reveal Splitter ---
    const textRevealElements = document.querySelectorAll('.text-reveal');
    textRevealElements.forEach(element => {
        const text = element.textContent.trim();
        const words = text.split(/\s+/);
        element.innerHTML = ''; // Clear original text
        
        words.forEach((word, index) => {
            const wordWrapper = document.createElement('span');
            wordWrapper.className = 'word-wrapper';
            
            const wordInner = document.createElement('span');
            wordInner.className = 'word-inner';
            wordInner.textContent = word;
            wordInner.style.transitionDelay = `${index * 0.06}s`; // Stagger reveal
            
            wordWrapper.appendChild(wordInner);
            element.appendChild(wordWrapper);
            
            // Add spacer space except for last word
            if (index < words.length - 1) {
                element.appendChild(document.createTextNode(' '));
            }
        });
    });

    // --- Intersection Observer for Scroll Reveal Animations ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .text-reveal, .animate-text-reveal');
    
    if (animatedElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.02 // Set low threshold (2%) to guarantee triggering on mobile tall screens
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Animate once
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            revealObserver.observe(element);
        });
    }

    // --- Start Preloading ---
    preloadFrames();
});
