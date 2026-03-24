import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { GraphExploreService } from "./graph-explore.service";

@ApiTags("Graph Explore")
@Controller("graph")
export class GraphExploreController {
  constructor(private exploreService: GraphExploreService) {}

  @Get("explore")
  @ApiOperation({ summary: "Get sub-graph for visualization" })
  @ApiQuery({ name: "state", required: false })
  @ApiQuery({ name: "depth", required: false, type: Number })
  @ApiQuery({ name: "nodeType", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getExplore(
    @Query("state") state?: string,
    @Query("depth") depth?: string,
    @Query("nodeType") nodeType?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
  ) {
    return this.exploreService.getSubGraph({
      state,
      depth: depth ? parseInt(depth, 10) : undefined,
      nodeType,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("node/:id")
  @ApiOperation({ summary: "Get single node with connections" })
  async getNode(@Param("id") id: string) {
    const node = await this.exploreService.getNodeDetail(id);
    if (!node) {
      throw new NotFoundException("Node not found");
    }
    return node;
  }

  @Get("stats")
  @ApiOperation({ summary: "Get graph statistics" })
  async getStats() {
    return this.exploreService.getStats();
  }
}
