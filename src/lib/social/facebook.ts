const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export class FacebookClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async publishPost(pageId: string, content: string, mediaUrl?: string) {
    if (mediaUrl) {
      const photoUrl = `${GRAPH_API_BASE}/${pageId}/photos`;
      const res = await fetch(photoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mediaUrl,
          caption: content,
          access_token: this.accessToken,
        }),
      });
      return res.json();
    }

    const url = `${GRAPH_API_BASE}/${pageId}/feed`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        access_token: this.accessToken,
      }),
    });
    return res.json();
  }

  async getPageInsights(pageId: string) {
    const url = `${GRAPH_API_BASE}/${pageId}/insights?metric=page_impressions,page_engaged_users&period=day&access_token=${this.accessToken}`;
    const res = await fetch(url);
    return res.json();
  }

  async getPageInfo(pageId: string) {
    const url = `${GRAPH_API_BASE}/${pageId}?fields=id,name,username,picture&access_token=${this.accessToken}`;
    const res = await fetch(url);
    return res.json();
  }
}
