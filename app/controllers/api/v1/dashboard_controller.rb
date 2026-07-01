module Api
  module V1
    class DashboardController < ApplicationController
      def show
        render json: {
          user: { id: current_user.id, email: current_user.email },
          stats: { message: "Welcome to your dashboard" }
        }
      end
    end
  end
end
