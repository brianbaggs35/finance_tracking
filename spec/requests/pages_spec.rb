require "rails_helper"

RSpec.describe "SPA catch-all", type: :request do
  describe "GET /" do
    it "returns 200 and renders the application layout" do
      get root_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('<div id="app">')
    end
  end

  describe "GET /some/deep/route" do
    it "returns 200 for any frontend route" do
      get "/some/deep/route"
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('<div id="app">')
    end
  end

  describe "GET /api/v1/anything" do
    it "is not caught by the SPA route" do
      get "/api/v1/anything"
      expect(response).to have_http_status(:not_found)
    end
  end
end
