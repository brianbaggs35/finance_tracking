require "rails_helper"

RSpec.describe "Api::V1::Setup", type: :request do
  describe "GET /api/v1/setup/status" do
    context "when no users exist" do
      it "returns setup_required: true" do
        get "/api/v1/setup/status", as: :json

        expect(response).to have_http_status(:ok)
        expect(json["setup_required"]).to be true
      end
    end

    context "when a user already exists" do
      before { create(:user) }

      it "returns setup_required: false" do
        get "/api/v1/setup/status", as: :json

        expect(response).to have_http_status(:ok)
        expect(json["setup_required"]).to be false
      end
    end
  end

  describe "POST /api/v1/setup/account" do
    let(:valid_params) do
      { user: { email: "admin@example.com", password: "Password1!", password_confirmation: "Password1!" } }
    end

    context "when no users exist" do
      it "creates the user and returns their data with a csrf token" do
        post "/api/v1/setup/account", params: valid_params, as: :json

        expect(response).to have_http_status(:ok)
        expect(json.dig("user", "email")).to eq("admin@example.com")
        expect(json).to have_key("csrf_token")
        expect(User.count).to eq(1)
      end

      it "signs the user in so the session is active" do
        post "/api/v1/setup/account", params: valid_params, as: :json
        get "/api/v1/auth/me", as: :json

        expect(json.dig("user", "email")).to eq("admin@example.com")
      end

      it "downcases the email before saving" do
        post "/api/v1/setup/account",
             params: { user: valid_params[:user].merge(email: "ADMIN@EXAMPLE.COM") },
             as: :json

        expect(json.dig("user", "email")).to eq("admin@example.com")
      end

      it "returns 422 when the password is too short" do
        post "/api/v1/setup/account",
             params: { user: { email: "admin@example.com", password: "short", password_confirmation: "short" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to be_present
      end

      it "returns 422 when passwords do not match" do
        post "/api/v1/setup/account",
             params: { user: { email: "admin@example.com", password: "Password1!", password_confirmation: "Different1!" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when a user already exists" do
      before { create(:user) }

      it "returns 403 and does not create another user" do
        expect {
          post "/api/v1/setup/account", params: valid_params, as: :json
        }.not_to change(User, :count)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/setup/ssl" do
    let(:user) { create(:user) }

    before do
      sign_in user
      # Stub at the lowest level so private methods still run (for coverage)
      allow_any_instance_of(Api::V1::SetupController).to receive(:system).and_return(true)
      allow(FileUtils).to receive(:mkdir_p)
      allow(File).to receive(:open).with(anything, "w", 0o600).and_yield(StringIO.new)
      allow(File).to receive(:exist?).and_return(false)
      allow(File).to receive(:delete)
      allow(File).to receive(:write).with(match(%r{/etc/nginx/conf\.d/}), anything)
      allow(Dir).to receive(:exist?).with("/etc/nginx/conf.d").and_return(true)
    end

    context "with a self-signed certificate" do
      it "returns success and calls openssl with the correct arguments" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "openssl", "req", "-x509", "-nodes", "-days", "3650",
          "-newkey", "rsa:2048",
          "-keyout", "/etc/letsencrypt/selfsigned/privkey.pem",
          "-out",    "/etc/letsencrypt/selfsigned/fullchain.pem",
          "-subj",   "/CN=localhost"
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "selfsigned", domain: "localhost" } },
             as: :json

        expect(response).to have_http_status(:ok)
        expect(json["success"]).to be true
      end
    end

    context "with Let's Encrypt - Cloudflare" do
      it "calls certbot with the cloudflare dns plugin" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--dns-cloudflare", "--dns-cloudflare-credentials", anything
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "cloudflare",
                               credentials: { api_token: "token" } } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "with Let's Encrypt - Ionos" do
      it "calls certbot with the ionos dns plugin" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--dns-ionos", "--dns-ionos-credentials", anything
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "ionos",
                               credentials: { public_prefix: "prefix", api_key: "key" } } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "with Let's Encrypt - DigitalOcean" do
      it "calls certbot with the digitalocean dns plugin" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--dns-digitalocean", "--dns-digitalocean-credentials", anything
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "digitalocean",
                               credentials: { api_token: "token" } } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "with Let's Encrypt - GoDaddy" do
      it "calls certbot with the godaddy dns plugin" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--dns-godaddy", "--dns-godaddy-credentials", anything
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "godaddy",
                               credentials: { api_key: "key", api_secret: "secret" } } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "with Let's Encrypt - Route 53" do
      it "calls certbot with the route53 dns plugin (no credentials file)" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--dns-route53"
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "route53",
                               credentials: {} } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "with Let's Encrypt - unknown provider (HTTP challenge fallback)" do
      it "falls back to webroot http challenge" do
        expect_any_instance_of(Api::V1::SetupController).to receive(:system).with(
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", user.email, "-d", "example.com",
          "--webroot", "--webroot-path", "/var/www/certbot"
        ).and_return(true)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "letsencrypt", domain: "example.com", provider: "other",
                               credentials: {} } },
             as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "when certificate generation fails" do
      it "returns 422 with an error message" do
        allow_any_instance_of(Api::V1::SetupController).to receive(:system).and_return(false)

        post "/api/v1/setup/ssl",
             params: { ssl: { type: "selfsigned", domain: "localhost" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json.dig("errors", "base")).to be_present
      end
    end

    context "with an invalid ssl type" do
      it "returns 422" do
        post "/api/v1/setup/ssl",
             params: { ssl: { type: "invalid", domain: "localhost" } },
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when not signed in" do
      before { sign_out user }

      it "returns 401" do
        post "/api/v1/setup/ssl",
             params: { ssl: { type: "selfsigned", domain: "localhost" } },
             as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
