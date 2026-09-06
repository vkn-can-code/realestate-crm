/**
 * Base DataProvider Abstract Class Architecture
 * Supports Firecrawl, licensed MLS feeds, RESO Web API, or manual CSV import providers.
 */
export class DataProvider {
  constructor(name = "BaseProvider") {
    this.name = name;
  }

  /** Discover available listing URLs on target domain */
  async discoverUrls({ website, includePatterns = [], excludePatterns = [], maxPages = 50 }) {
    throw new Error("discoverUrls() must be implemented by subclass DataProvider");
  }

  /** Scrape raw HTML/JSON content from verified listing pages */
  async collectPages(urls = []) {
    throw new Error("collectPages() must be implemented by subclass DataProvider");
  }

  /** Extract structured property fields from scraped pages */
  async extractListings(pages = []) {
    throw new Error("extractListings() must be implemented by subclass DataProvider");
  }

  /** Normalize extracted properties to standard real estate data schema */
  normalizeData(rawListings = []) {
    throw new Error("normalizeData() must be implemented by subclass DataProvider");
  }
}
