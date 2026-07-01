require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  let(:password) { "Password1!" }
  let(:user) { create(:user, password:, password_confirmation: password) }

  describe "POST /api/v1/auth/sign_in" do
    context "with valid credentials" do
      it "returns 200 with user data and csrf token" do
        post "/api/v1/auth/sign_in",
             params: { user: { email: user.email, password: } },
             as: :json

        expect(response).to have_http_status(:ok)
        expect(json.dig("user", "email")).to eq(user.email)
        expect(json.dig("user", "id")).to eq(user.id)
        expect(json).to have_key("csrf_token")
      end

      it "does not expose the encrypted password" do
        post "/api/v1/auth/sign_in",
             params: { user: { email: user.email, password: } },
             as: :json

        expect(json["user"]).not_to have_key("encrypted_password")
      end
    end

    context "with invalid credentials" do
      it "returns 422 for wrong password" do
        post "/api/v1/auth/sign_in",
             params: { user: { email: user.email, password: "wrong" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json.dig("errors", "base")).to be_present
      end

      it "returns 422 for unknown email" do
        post "/api/v1/auth/sign_in",
             params: { user: { email: "nobody@example.com", password: "anything" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "DELETE /api/v1/auth/sign_out" do
    it "returns 200 and clears the session" do
      sign_in user
      delete "/api/v1/auth/sign_out", as: :json
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/v1/auth/me" do
    context "when authenticated" do
      it "returns the current user" do
        sign_in user
        get "/api/v1/auth/me", as: :json

        expect(response).to have_http_status(:ok)
        expect(json.dig("user", "email")).to eq(user.email)
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        get "/api/v1/auth/me", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
