import axios, { AxiosInstance } from "axios";
import type { FileResponse, NodesResponse } from "@figma/rest-api-spec";

export function createFigmaClient(accessToken: string) {
  const client = axios.create({
    baseURL: "https://api.figma.com/v1",
    headers: {
      "X-Figma-Token": accessToken,
    },
  });

  return {
    async getFile(fileKey: string): Promise<FileResponse> {
      const response = await client.get<FileResponse>(`/files/${fileKey}`);
      return response.data;
    },

    async getNodes(fileKey: string, nodeIds: string[]): Promise<NodesResponse> {
      const response = await client.get<NodesResponse>(
        `/files/${fileKey}/nodes`,
        {
          params: { ids: nodeIds.join(",") },
        }
      );
      return response.data;
    },
  };
}
