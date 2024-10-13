export type SignatureParams = {
  adpToken: string;
  devicePrivateKey: string;
};

export const signRequest = async ({
  method,
  path,
  signatureParams: { adpToken, devicePrivateKey },
}: {
  method: "GET",
  path: string,
  body: string,
  signatureParams: SignatureParams;
}): Promise<Headers> => {

};
