// Pagination types
export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
};

// API Response types
export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Date range filter
export type DateRangeFilter = {
  from?: string;
  to?: string;
};
