const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export class FacebookClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Publish to a Facebook Page's feed. `accessToken` MUST be the page access
   * token (not the user token). If mediaUrl is provided, uses /{page}/photos
   * with a `url` param — Facebook fetches it server-side.
   */
  async publishPost(pageId: string, content: string, mediaUrl?: string) {
    if (mediaUrl) {
      const params = new URLSearchParams({
        url: mediaUrl,
        caption: content,
        access_token: this.accessToken,
      });
      const res = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          `Facebook /photos error (${res.status}): ${data.error?.message || JSON.stringify(data)}`
        );
      }
      return data;
    }

    const params = new URLSearchParams({
      message: content,
      access_token: this.accessToken,
    });
    const res = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(
        `Facebook /feed error (${res.status}): ${data.error?.message || JSON.stringify(data)}`
      );
    }
    return data;
  }

  async getPageInsights(pageId: string) {
    const url = `${GRAPH_API_BASE}/${pageId}/insights?metric=page_impressions,page_engaged_users&period=day&access_token=${encodeURIComponent(this.accessToken)}`;
    const res = await fetch(url);
    return res.json();
  }

  async getPageInfo(pageId: string) {
    const url = `${GRAPH_API_BASE}/${pageId}?fields=id,name,username,picture&access_token=${encodeURIComponent(this.accessToken)}`;
    const res = await fetch(url);
    return res.json();
  }
}
