import { chromium } from 'playwright';
import axios from 'axios';
import fs from 'fs';

export function extractVideoId(url) {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
}

export function extractUsername(url) {
    const match = url.match(/@([^/]+)/);
    return match ? match[1] : null;
}

export async function getUserVideos(username) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        const profileUrl = `https://www.tiktok.com/@${username}`;
        await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);

        let previousHeight = 0;
        let currentHeight = await page.evaluate(() => document.body.scrollHeight);

        while (previousHeight !== currentHeight) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);
            previousHeight = currentHeight;
            currentHeight = await page.evaluate(() => document.body.scrollHeight);
        }

        const videoLinks = await page.evaluate((username) => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            const videoPattern = new RegExp(`^https://www\\.tiktok\\.com/@${username}/video/\\d+`);
            return links
                .map(link => link.href)
                .filter(href => videoPattern.test(href))
                .filter((href, index, self) => self.indexOf(href) === index);
        }, username);

        await browser.close();
        return videoLinks;
    } catch (error) {
        await browser.close();
        throw error;
    }
}

export async function getVideoDataFromAPI(videoId, withWatermark = false) {
    const apiUrl = `https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/?aweme_id=${videoId}&iid=7238789370386695942&device_id=7238787983025079814&resolution=1080*2400&channel=googleplay&app_name=musical_ly&version_code=350103&device_platform=android&device_type=Pixel+7&os_version=13`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'com.zhiliaoapp.musically/2023505030 (Linux; U; Android 13; en_US; Pixel 7; Build/TP1A.220624.014; Cronet/TTNetVersion:6c7b701a 2023-04-23 QuicVersion:0144d358 2023-03-24)',
            },
            timeout: 30000
        });

        if (!response.data?.aweme_list?.[0]) {
            throw new Error('No video data found');
        }

        const video = response.data.aweme_list[0];
        const videoUrl = withWatermark
            ? video?.video?.download_addr?.url_list?.[0]
            : video?.video?.play_addr?.url_list?.[0];

        if (!videoUrl) {
            throw new Error('No video URL found');
        }

        return {
            url: videoUrl,
            id: videoId,
            author: video?.author?.unique_id || 'unknown',
            desc: video?.desc || ''
        };
    } catch (error) {
        if (error.response?.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return getVideoDataFromAPI(videoId, withWatermark);
        }
        throw error;
    }
}

export async function downloadVideo(videoUrl, outputPath) {
    const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        headers: {
            'User-Agent': 'com.zhiliaoapp.musically/2023505030 (Linux; U; Android 13; en_US; Pixel 7; Build/TP1A.220624.014; Cronet/TTNetVersion:6c7b701a 2023-04-23 QuicVersion:0144d358 2023-03-24)',
            'Referer': 'https://www.tiktok.com/'
        },
        timeout: 60000
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}