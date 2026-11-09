// ==UserScript==
// @name        4chan Captcha Formatter - All Puzzles
// @namespace   4chan-captcha-formatter
// @match       https://boards.4chan.org/*
// @match       https://sys.4chan.org/*
// @match       https://4chan.org/banned
// @grant       none
// @version     1.7.0
// @license     MIT
// @description Displays all CAPTCHA puzzles simultaneously.
// ==/UserScript==

(function () {
    'use strict';

    const containerSelector = '#t-task';
    const imageSelector = '.tcaptcha-image';

    let cachedButtons = [];
    let selectedImages = [];

    const style = document.createElement('style');

    style.textContent = `
        #t-task {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 4px !important;
            box-sizing: border-box !important;
        }

        #t-next {
            display: none !important;
        }

        .captcha-images {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 5px !important;
            width: 100% !important;
        }

        .tcaptcha-image {
            display: block !important;
            width: 100% !important;
            aspect-ratio: 1 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: 3px solid transparent !important;
            box-sizing: border-box !important;
            background: none !important;
            cursor: pointer !important;
        }

        .tcaptcha-image img {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
        }

        .tcaptcha-image.selected {
            border: 3px solid maroon !important;
        }

        .captcha-root,
        .captcha-root > div {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
        }
    `;

    document.head.appendChild(style);

    function updateResponse() {
        const complete = selectedImages.every(index => index >= 0);

        TCaptcha.respNode.value = complete
            ? selectedImages.join('')
            : '';

        if (complete) {
            TCaptcha.setTaskId(TCaptcha.tasks.length - 1);
        }
    }

    function updateSelections() {
        cachedButtons.forEach(button => {
            const taskIndex = Number(button.dataset.taskIndex);
            const imageIndex = Number(button.dataset.imageIndex);

            button.classList.toggle(
                'selected',
                selectedImages[taskIndex] === imageIndex
            );
        });

        updateResponse();
    }

    function createImageGrid() {
        const container = document.querySelector(containerSelector);
        const tasks = TCaptcha.tasks;

        if (!TCaptcha.node || !container || !tasks?.length) return;

        TCaptcha.node.style.height = 'auto';
        TCaptcha.node.style.overflow = 'visible';

        container.replaceChildren();
        selectedImages = Array(tasks.length).fill(-1);

        tasks.forEach((task, taskIndex) => {
            const grid = document.createElement('div');
            grid.className = 'captcha-images';

            task.items.forEach((bitmap, imageIndex) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'tcaptcha-image';
                button.dataset.taskIndex = taskIndex;
                button.dataset.imageIndex = imageIndex;

                const img = document.createElement('img');
                img.src = `data:image/png;base64,${bitmap}`;

                button.appendChild(img);
                grid.appendChild(button);
            });

            container.appendChild(grid);
        });

        cachedButtons = Array.from(
            container.querySelectorAll(imageSelector)
        );

        initializeEventHandler(container);

        TCaptcha.taskNode = container;
        updateResponse();
    }

    function initializeEventHandler(container) {
        if (container.dataset.hasListener) return;

        container.addEventListener('click', event => {
            const button = event.target.closest(imageSelector);

            if (!button || !cachedButtons.includes(button)) return;

            const taskIndex = Number(button.dataset.taskIndex);
            const imageIndex = Number(button.dataset.imageIndex);

            selectedImages[taskIndex] =
                selectedImages[taskIndex] === imageIndex ? -1 : imageIndex;

            updateSelections();
        });

        container.dataset.hasListener = 'true';
    }

    TCaptcha.setChallenge = function (challenge) {
        this.challengeIdNode.value = challenge.challenge;
        this.respNode.value = '';

        if (!challenge.tasks) return this.setNoop();

        this.tasks = challenge.tasks;
        this.setTaskId(0);

        createImageGrid();
    };

    TCaptcha.setTaskId = function (index) {
        this.taskId = index;
        this.nextNode.textContent = '';
    };

    TCaptcha.buildSliderNode = () =>
        Object.assign(document.createElement('span'), {
            id: 't-slider',
            hidden: true
        });

    TCaptcha.buildNextNode = () =>
        Object.assign(document.createElement('span'), {
            id: 't-next'
        });
})();
