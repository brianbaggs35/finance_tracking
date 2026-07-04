module Api
  module V1
    class SetupController < ApplicationController
      skip_before_action :authenticate_user!, only: %i[status create_account]

      def status
        render json: { setup_required: User.none? }
      end

      def create_account
        return render json: { error: "Setup already complete" }, status: :forbidden if User.any?

        user = User.new(
          email: params.dig(:user, :email)&.downcase&.strip,
          password: params.dig(:user, :password),
          password_confirmation: params.dig(:user, :password_confirmation)
        )

        if user.save
          sign_in(:user, user)
          render json: {
            user: { id: user.id, email: user.email },
            csrf_token: form_authenticity_token
          }
        else
          render json: { errors: user.errors }, status: :unprocessable_content
        end
      end

      def configure_ssl
        type   = params.dig(:ssl, :type)
        domain = params.dig(:ssl, :domain)&.strip.presence || "localhost"

        success = case type
        when "selfsigned"   then generate_selfsigned(domain)
        when "letsencrypt"  then generate_letsencrypt(domain, params.dig(:ssl, :provider), params.dig(:ssl, :credentials))
        else return render json: { errors: { base: [ "Invalid SSL type" ] } }, status: :unprocessable_content
        end

        if success
          write_nginx_config(domain, type)
          render json: { success: true }
        else
          render json: { errors: { base: [ "Certificate generation failed. Check your domain and credentials." ] } }, status: :unprocessable_content
        end
      end

      private

      NGINX_CONF_DIR = "/etc/nginx/conf.d"

      def generate_selfsigned(domain)
        cert_dir = "/etc/letsencrypt/selfsigned"
        FileUtils.mkdir_p(cert_dir)
        system(
          "openssl", "req", "-x509", "-nodes", "-days", "3650",
          "-newkey", "rsa:2048",
          "-keyout", "#{cert_dir}/privkey.pem",
          "-out",    "#{cert_dir}/fullchain.pem",
          "-subj",   "/CN=#{domain}"
        )
      end

      def generate_letsencrypt(domain, provider, credentials)
        creds_file = write_credentials_file(provider, credentials)
        cmd     = build_certbot_command(domain, provider, creds_file)
        success = system(*cmd)
        File.delete(creds_file) if creds_file && File.exist?(creds_file)
        success
      end

      def build_certbot_command(domain, provider, creds_file)
        base = [
          "certbot", "certonly", "--non-interactive", "--agree-tos",
          "--email", current_user.email, "-d", domain
        ]

        case provider
        when "cloudflare"    then base + [ "--dns-cloudflare",    "--dns-cloudflare-credentials",    creds_file ]
        when "digitalocean"  then base + [ "--dns-digitalocean",  "--dns-digitalocean-credentials",  creds_file ]
        when "ionos"         then base + [ "--dns-ionos",         "--dns-ionos-credentials",         creds_file ]
        when "godaddy"       then base + [ "--dns-godaddy",       "--dns-godaddy-credentials",       creds_file ]
        when "route53"       then base + [ "--dns-route53" ]
        else                      base + [ "--webroot", "--webroot-path", "/var/www/certbot" ]
        end
      end

      def write_credentials_file(provider, credentials)
        return nil if credentials.blank? || provider == "route53"

        content = case provider
        when "cloudflare"   then "dns_cloudflare_api_token = #{credentials[:api_token]}"
        when "digitalocean" then "dns_digitalocean_token = #{credentials[:api_token]}"
        when "ionos"        then "dns_ionos_prefix = #{credentials[:public_prefix]}\ndns_ionos_secret = #{credentials[:api_key]}"
        when "godaddy"      then "dns_godaddy_key = #{credentials[:api_key]}\ndns_godaddy_secret = #{credentials[:api_secret]}"
        end

        return nil unless content

        path = Rails.root.join("tmp", "certbot_#{SecureRandom.hex(8)}.ini")
        File.open(path, "w", 0o600) { |f| f.write(content) }
        path.to_s
      end

      def write_nginx_config(domain, type)
        return unless Dir.exist?(NGINX_CONF_DIR)

        File.write("#{NGINX_CONF_DIR}/.domain",    domain)
        File.write("#{NGINX_CONF_DIR}/.cert_type", type)
      end
    end
  end
end
