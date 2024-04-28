# Playable YouTube videos

**Requires a server plugin to function! Install it from here: [SillyTavern-YouTube-Videos-Server](https://github.com/SillyTavern/SillyTavern-YouTube-Videos-Server)**

## Insert videos

Automatically replaces links to YouTube videos that have `@` before them with HTML `<video>` tags in chat messages.

### Example 1

> Insert any URL instead of `youtu.be/zFfL0y3zyfc`.

`@youtu.be/zFfL0y3zyfc` => `<video src="/api/plugins/youtube/play/https://youtu.be/zFfL0y3zyfc" controls="" autoplay="" style="width: 100%; height: auto;"></video>`

## Fetch video info

This extension provides a set of macros to get various information about the YouTube video.

### Example 2

> Insert any video ID *or* URL instead of `zFfL0y3zyfc`.

```txt
{{yt-title::zFfL0y3zyfc}} => video title
{{yt-uploader::zFfL0y3zyfc}} => uploader name
{{yt-thumb::zFfL0y3zyfc}} => URL to thumbnail image
{{yt-thumb-img::zFfL0y3zyfc}} => thumbnail image as Markdown embed (requires External Media to be enabled!)
{{yt-length::zFfL0y3zyfc}} => length of the video (in minutes:seconds)
{{yt-views::zFfL0y3zyfc}} => number of video views
{{yt-description::zFfL0y3zyfc}} => video description
```

## License

AGPLv3
