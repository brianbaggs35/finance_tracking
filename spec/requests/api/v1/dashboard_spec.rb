require "rails_helper"

RSpec.describe "Api::V1::Dashboard", type: :request do
  let(:user) { create(:user) }

  describe "GET /api/v1/dashboard" do
    context "when authenticated" do
      it "returns 200 with dashboard data" do
        sign_in user
        get "/api/v1/dashboard", as: :json

        expect(response).to have_http_status(:ok)
        expect(json.dig("user", "email")).to eq(user.email)
        expect(json).to have_key("stats")
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        get "/api/v1/dashboard", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
