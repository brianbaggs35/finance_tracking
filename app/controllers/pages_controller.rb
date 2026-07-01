class PagesController < ApplicationController
  def spa
    render layout: "application", html: ""
  end
end
