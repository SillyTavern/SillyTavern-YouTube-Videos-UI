const { eventSource, event_types } = SillyTavern.getContext();

/**
 * Extracts video IDs from a message text
 * @param {string} text Message text
 * @returns {string[]} Array of video IDs
 */
function replaceYouTubeVideos(text) {
    let regex = /@(http:\/\/|https:\/\/)?(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm;

    return text.replace(regex, (match, p1, p2, p3, p4) => {
        console.log('[ST-YT] Found YouTube video:', p4);
        const videoElement = document.createElement('video');
        videoElement.src = `/api/plugins/youtube/play/https://youtu.be/${p4}`;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.style.height = 'auto';
        return videoElement.outerHTML;
    });
}

function onMessageEvent(messageIndex) {
    const { chat } = SillyTavern.getContext();
    const message = chat[messageIndex];
    if (!message) {
        return;
    }

    message.mes = replaceYouTubeVideos(message.mes);
}

eventSource.on(event_types.MESSAGE_SENT, onMessageEvent);
eventSource.on(event_types.MESSAGE_RECEIVED, onMessageEvent);
