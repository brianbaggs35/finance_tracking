require "rails_helper"

RSpec.describe "Routes", type: :routing do
  it "routes GET / to pages#spa" do
    expect(get: "/").to route_to("pages#spa")
  end

  it "routes GET /up to rails/health#show" do
    expect(get: "/up").to route_to("rails/health#show")
  end

  it "routes deep paths to pages#spa" do
    expect(get: "/foo/bar/baz").to route_to(controller: "pages", action: "spa", path: "foo/bar/baz")
  end
end
