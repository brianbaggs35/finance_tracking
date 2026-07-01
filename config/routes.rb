Rails.application.routes.draw do
  # Devise — model-only, all HTML routes skipped (SPA handles auth UI)
  devise_for :users, skip: :all

  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/sign_in",  to: "auth#create"
      delete "auth/sign_out", to: "auth#destroy"
      get "auth/me",        to: "auth#show"

      get "dashboard", to: "dashboard#show"
    end
  end

  # Catch-all: serve the Vue SPA for any non-API route
  get "*path", to: "pages#spa", constraints: ->(req) { !req.path.start_with?("/api/", "/rails/") }
  root "pages#spa"
end
