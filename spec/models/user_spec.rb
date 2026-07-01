require "rails_helper"

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe "validations" do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:password) }

    it "requires password to be at least 8 characters" do
      user.password = "short"
      user.password_confirmation = "short"
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end
  end

  describe "factory" do
    it "creates a valid user" do
      expect(create(:user)).to be_persisted
    end
  end
end
