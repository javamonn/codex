export const assertResponseStatus = async (res: Response): Promise<void> => {
  if (!res.ok) {
    const resCopy = res.clone();
    const resText = await resCopy.text();

    throw new Error(
      `Failed to fetch "${resCopy.url}": ${resCopy.status} ${resCopy.statusText} - ${resText}`
    );
  }
};
