const { getRequestHeaders, eventSource, event_types } = SillyTavern.getContext();

/**
 * Extracts the video ID from a YouTube URL
 * @param {string} url String containing the URL
 * @returns {string} Video ID
 */
function getVideoId(url) {
    // Using the video ID as is
    if (url.length === 11) {
        return url;
    }

    const regex = /(http:\/\/|https:\/\/)?(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm;
    let match = regex.exec(url);
    if (match) {
        return match[4];
    }

    return null;
}

/**
 * Extracts video IDs from a message text
 * @param {string} text Message text
 * @returns {string[]} Array of video IDs
 */
function replaceYouTubeVideos(text) {
    const regex = /@(http:\/\/|https:\/\/)?(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm;

    return text.replace(regex, (_match, _protocol, _domain, _path, id) => {
        console.log('[ST-YT] Found YouTube video:', id);
        const videoElement = document.createElement('video');
        videoElement.src = `/api/plugins/youtube/play/${encodeURIComponent(`https://youtu.be/${id}`)}`;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.style.height = 'auto';
        return videoElement.outerHTML;
    });
}

/**
 * Asynchronously replaces text using a regex and an async function.
 * @param {string} str String to search for matches
 * @param {RegExp} regex Regular expression to match
 * @param {function} asyncFn Async function to replace matches
 * @returns {Promise<string>} String with matches replaced
 */
async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (full, ...args) => {
        promises.push(asyncFn(full, ...args));
        return full;
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

/**
 * Cache for video info
 * @type {Map<string, object>}
 */
const INFO_CACHE = new Map();

/**
 * Fetches video info from the server.
 * @param {string} videoId Video ID
 * @returns {Promise<object>} Video info
 */
async function getVideoInfo(videoId) {
    if (INFO_CACHE.has(videoId)) {
        return INFO_CACHE.get(videoId);
    }

    const response = await fetch(`/api/plugins/youtube/info/${encodeURIComponent(`https://youtu.be/${videoId}`)}`);
    const data = await response.json();
    INFO_CACHE.set(videoId, data);
    return data;
}

/**
 * Replaces YouTube macros in a text.
 * @param {string} text Text to search for YouTube macros
 * @returns {Promise<string>} Text with macros replaced
 */
async function replaceYouTubeMacros(text) {
    if (!text) {
        return text;
    }

    if (!text.includes('{{yt-')) {
        return text;
    }

    const macroPattern = /{{yt-([a-z_-]+)\s?::?([^}]+)}}/gi;
    text = await replaceAsync(text, macroPattern, macroReplacer);
    return text;
}

/**
 * Escapes Markdown characters in a string.
 * @param {string} text Text to escape
 * @returns {string} Text with escaped Markdown characters
 */
function escapeMarkdown(text) {
    return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

/**
 * Replaces a YouTube macro with the corresponding video information.
 * @param {string} _match Regular expression match
 * @param {string} macro Macro name
 * @param {string} url Video URL
 * @returns {Promise<string>} Replaced text
 */
async function macroReplacer(_match, macro, url) {
    if (!url) {
        console.log('[ST-YT] No video ID provided');
        return '';
    }

    macro = macro.trim().toLowerCase();
    url = url.trim();

    console.log('[ST-YT] Found YouTube macro:', macro, url);

    if (macro === 'id') {
        return getVideoId(url);
    }

    const info = await getVideoInfo(getVideoId(url));

    if (!info) {
        console.log('[ST-YT] No video info found');
        return '';
    }

    switch (macro) {
        case 'title':
        case 'name':
            return info.title;
        case 'thumbnail':
        case 'thumb':
            return info.thumbnail;
        case 'thumb-img':
        case 'thumbnail-img':
            return `![${escapeMarkdown(info.title)}](${info.thumbnail} =240x*)`;
        case 'duration':
        case 'length':
            return `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`;
        case 'channel':
        case 'uploader':
        case 'author':
            return info.uploader;
        case 'views':
            return info.view_count;
        case 'date':
        case 'uploaded':
            // 20210101 -> 2021-01-01
            return info.upload_date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
        case 'description':
            return info.description;
        case 'url':
            return info.url;
        default:
            if (info[macro]) {
                switch (typeof info[macro]) {
                    case 'string':
                        return info[macro];
                    case 'number':
                        return String(info[macro]);
                    default:
                        return JSON.stringify(info[macro]);
                }
            }
            return '';
    }
}

/**
 * Event handler for chat messages.
 * @param {number} messageIndex Chat message index
 * @returns {Promise<void>}
 */
async function onMessageEvent(messageIndex) {
    const { chat } = SillyTavern.getContext();
    const message = chat[messageIndex];
    if (!message) {
        return;
    }

    message.mes = replaceYouTubeVideos(message.mes);
    message.mes = await replaceYouTubeMacros(message.mes);
}

async function isPluginAvailable() {
    const response = await fetch('/api/plugins/youtube/probe', {
        method: 'POST',
        headers: getRequestHeaders(),
    });
    return response.ok;
}

const pluginAvailable = await isPluginAvailable();

if (!pluginAvailable) {
    if (!localStorage.getItem('yt-server-warning')) {
        localStorage.setItem('yt-server-warning', 'true');
        toastr.warning(
            'Follow the link for instructions: <a href="https://github.com/SillyTavern/SillyTavern-YouTube-Videos-Server">SillyTavern-YouTube-Videos-Server</a>',
            'Server plugin is not available',
            { timeOut: 0, extendedTimeOut: 0, escapeHtml: false, closeButton: true },
        );
        throw new Error('YouTube Videos server plugin is not available');
    }
}

eventSource.on(event_types.MESSAGE_SENT, onMessageEvent);
eventSource.on(event_types.MESSAGE_RECEIVED, onMessageEvent);
eventSource.on(event_types.MESSAGE_EDITED, onMessageEvent);
