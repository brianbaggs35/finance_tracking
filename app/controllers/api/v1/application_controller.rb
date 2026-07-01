module Api
  module V1
    class ApplicationController < ::ApplicationController
      protect_from_forgery with: :null_session
      before_action :authenticate_user!

      rescue_from ActiveRecord::RecordNotFound do
        render json: { error: "Not found" }, status: :not_found
      end

      private

      def authenticate_user!
        return if current_user

        render json: { error: "Unauthorized" }, status: :unauthorized
      end
    end
  end
end
