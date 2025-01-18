import AsyncStorage from "@react-native-async-storage/async-storage";
import { LibraryItem } from "./library";

type State =
  // remote only aax or aaxc asset
  | { type: "initial" }
  // aax asset download in progress
  | { type: "downloading" }
  // aax asset downloaded and available for processing
  | { type: "downloaded" }
  // aax asset processing to mp3 in progress
  | { type: "processing" }
  // mp3 asset available locally for playback
  | { type: "processed" }
  // an error occurred
  | { type: "error" };

export class AssetSourceMetadata {
  state: State;

  constructor(state: State) {
    this.state = state;
  }

  // Returns a map of asin to AssetSourceMetadata
  public static async getManyByAsin(
    libraryItems: LibraryItem[]
  ): Promise<Record<string, AssetSourceMetadata>> {
    const asinByKey = libraryItems.reduce<Record<string, string>>(
      (acc, libraryItem) => {
        const key = AssetSourceMetadata.getAsyncStorageKey(libraryItem.asin);
        acc[key] = libraryItem.asin;

        return acc;
      },
      {}
    );

    const metadatasByAsin = await AsyncStorage.multiGet(
      Object.keys(asinByKey)
    ).then((items) =>
      items.reduce<Record<string, AssetSourceMetadata>>((acc, [key, value]) => {
        const asin = asinByKey[key];
        if (!asin) {
          return acc;
        }
        let metadata: State = { type: "initial" };
        if (value) {
          try {
            metadata = JSON.parse(value);
          } catch (_) {
            /* noop */
          }
        }

        acc[asin] = new AssetSourceMetadata(metadata);

        return acc;
      }, {} as Record<string, AssetSourceMetadata>)
    );

    return libraryItems.reduce<Record<string, AssetSourceMetadata>>(
      (acc, libraryItem) => {
        let metadata =
          metadatasByAsin[libraryItem.asin] ??
          new AssetSourceMetadata({ type: "initial" });
        acc[libraryItem.asin] = metadata;
        return acc;
      },
      {}
    );
  }

  public static getAsyncStorageKey(asin: string): string {
    return `audible:asset-source-metadata:${asin}`;
  }
}
