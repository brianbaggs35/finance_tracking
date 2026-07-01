export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    perPage: number
  }
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}
