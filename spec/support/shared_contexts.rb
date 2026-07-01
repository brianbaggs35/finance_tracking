RSpec.shared_context "with authenticated user" do
  let(:current_user) { create(:user) }

  before { allow(controller).to receive(:current_user).and_return(current_user) }
end
