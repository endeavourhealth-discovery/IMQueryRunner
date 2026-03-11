import { type LocationQuery, type Router, useRouter } from "vue-router";
import { useDirectoryStore } from "vue-library/stores";

export default class DirectService {
  private readonly directoryStore;
  private readonly _message: string;
  private readonly router: Router;

  constructor() {
    this.router = useRouter();
    this.directoryStore = useDirectoryStore();
    this._message =
      "You will be directed to a different application. Are you sure you want to proceed?";
  }

  private async directTo(options: {
    iri?: string;
    action?: string;
    appRoute: string;
    query?: LocationQuery;
    newTab?: boolean;
  }) {
    let pathUrl = "";
    pathUrl += options.appRoute + "/";
    if (options.iri) pathUrl += encodeURIComponent(options.iri);
    if (!options.newTab) {
      if (options.iri) this.directoryStore.updateConceptIri(options.iri);
      await this.router.push({
        path: "/" + pathUrl,
        query: options.query,
      });
    } else {
      window.open(import.meta.env.NUXT_PUBLIC_IM_DIRECTORY_URL + pathUrl);
    }
  }

  public async view(iri: string) {
    await this.directTo({
      iri: iri,
      action: "Viewed",
      appRoute: "directory/folder",
      newTab: true,
    });
  }

  public async select(iri: string) {
    await this.directTo({
      iri: iri,
      action: "Viewed",
      appRoute: "directory/folder",
      newTab: false,
    });
  }

  public async edit(iri: string, openInNewTab?: boolean) {
    if (iri)
      await this.directTo({
        iri: iri,
        action: "Edited",
        appRoute: "editor",
        newTab: openInNewTab,
      });
    else await this.directTo({ appRoute: "editor", newTab: true });
  }

  public async create(
    typeIri?: string,
    propertyIri?: string,
    valueIri?: string,
  ) {
    if (!typeIri && !propertyIri && !valueIri) {
      await this.directTo({ appRoute: "creator", newTab: false });
    } else {
      const routeData = this.router.resolve({
        name: "Creator",
        query: {
          typeIri: typeIri,
          propertyIri: propertyIri,
          valueIri: valueIri,
        },
      });
      await this.directTo({
        appRoute: routeData.href.replace("#/", ""),
        query: routeData.query,
        newTab: false,
      });
    }
  }
}
