module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: %i[create show]

      def create
        user = User.find_by(email: params.dig(:user, :email)&.downcase&.strip)

        if user&.valid_password?(params.dig(:user, :password))
          sign_in(:user, user)
          render json: {
            user: serialize_user(user),
            csrf_token: form_authenticity_token
          }
        else
          render json: { errors: { base: [ "Invalid email or password" ] } },
                 status: :unprocessable_content
        end
      end

      def destroy
        sign_out(:user)
        render json: {}
      end

      def show
        if current_user
          render json: { user: serialize_user(current_user) }
        else
          render json: { user: nil }, status: :unauthorized
        end
      end

      private

      def serialize_user(user)
        { id: user.id, email: user.email }
      end
    end
  end
end
